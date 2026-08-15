// Landing-page behavior: the depth gauge, and the demo terminal.
// Vanilla JS, no dependencies. All motion respects prefers-reduced-motion.

(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Depth gauge: the disk sinks as the reader scrolls. ---- */
  var disk = document.getElementById("gauge-disk");
  var depthLabel = document.getElementById("gauge-depth");

  function updateGauge() {
    if (!disk) return;
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var progress = max > 0 ? window.scrollY / max : 0;
    var travel = window.innerHeight - 96;
    disk.style.top = 12 + progress * travel + "px";
    // The deepest recorded Secchi-disk reading is ~80 m (Weddell Sea).
    depthLabel.textContent = (progress * 80).toFixed(1) + " m";
  }
  window.addEventListener("scroll", updateGauge, { passive: true });
  window.addEventListener("resize", updateGauge);
  updateGauge();

  /* ---- Demo terminal: type the real command, reveal the real output. ---- */
  var body = document.getElementById("terminal-body");
  var terminal = document.getElementById("terminal");
  // Scoped to [data-demo] specifically: .tab is reused by the per-product
  // install/code tabs too, and a bare ".tab" selector here would cross-talk
  // between unrelated tab groups on click.
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".tab[data-demo]"));
  var demos = window.SECCHI_DEMOS || {};
  var runToken = 0;

  function esc(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function renderStatic(demo) {
    var html = '<span class="prompt">$ </span><span class="cmd">' + esc(demo.command) + "</span>\n";
    html += demo.lines.map(function (line) { return esc(line); }).join("\n");
    if (demo.command2) {
      html += '\n\n<span class="prompt">$ </span><span class="cmd">' + esc(demo.command2) + "</span>\n";
      html += demo.lines2.map(function (line) { return esc(line); }).join("\n");
    }
    body.innerHTML = html;
  }

  function typeCommand(command, token, done) {
    var i = 0;
    var cmdSpan = document.createElement("span");
    cmdSpan.className = "cmd";
    var cursor = document.createElement("span");
    cursor.className = "cursor";
    var prompt = document.createElement("span");
    prompt.className = "prompt";
    prompt.textContent = "$ ";
    body.appendChild(prompt);
    body.appendChild(cmdSpan);
    body.appendChild(cursor);

    (function step() {
      if (token !== runToken) return;
      if (i < command.length) {
        cmdSpan.textContent += command.charAt(i);
        i += 1;
        setTimeout(step, 34);
      } else {
        setTimeout(function () {
          if (token !== runToken) return;
          cursor.remove();
          body.appendChild(document.createTextNode("\n"));
          done();
        }, 260);
      }
    })();
  }

  function revealLines(lines, token, done) {
    var i = 0;
    (function step() {
      if (token !== runToken) return;
      if (i < lines.length) {
        var out = document.createElement("span");
        out.className = "out";
        out.textContent = lines[i] + "\n";
        body.appendChild(out);
        i += 1;
        setTimeout(step, 90);
      } else if (done) {
        done();
      }
    })();
  }

  function play(key) {
    var demo = demos[key];
    if (!demo || !body) return;
    terminal.setAttribute("data-active", key);
    body.innerHTML = "";
    if (reducedMotion) {
      renderStatic(demo);
      return;
    }
    var token = ++runToken;
    typeCommand(demo.command, token, function () {
      revealLines(demo.lines, token, function () {
        if (!demo.command2) return;
        body.appendChild(document.createTextNode("\n"));
        typeCommand(demo.command2, token, function () {
          revealLines(demo.lines2, token, null);
        });
      });
    });
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) {
        t.classList.toggle("is-active", t === tab);
        t.setAttribute("aria-selected", t === tab ? "true" : "false");
      });
      play(tab.getAttribute("data-demo"));
    });
  });

  // Start the first demo when it scrolls into view (or immediately if the
  // browser lacks IntersectionObserver).
  var started = false;
  function start() {
    if (started) return;
    started = true;
    play("pkg");
  }
  if ("IntersectionObserver" in window && terminal) {
    new IntersectionObserver(function (entries, observer) {
      if (entries.some(function (entry) { return entry.isIntersecting; })) {
        observer.disconnect();
        start();
      }
    }, { threshold: 0.3 }).observe(terminal);
  } else {
    start();
  }

  /* ---- Per-product tabbed groups: install commands ("Try first" / uv /
     pip / cargo) and the CLI analytics integration code (clap / click).
     Each group shows exactly one panel and one caption at a time. ---- */
  var cmdGroups = Array.prototype.slice.call(document.querySelectorAll("[data-cmd-group]"));
  cmdGroups.forEach(function (group) {
    var cmdTabs = Array.prototype.slice.call(group.querySelectorAll("[data-cmd-tab]"));
    var panels = Array.prototype.slice.call(group.querySelectorAll("[data-cmd-panel]"));
    var captions = Array.prototype.slice.call(group.querySelectorAll("[data-cmd-caption]"));
    cmdTabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var key = tab.getAttribute("data-cmd-tab");
        cmdTabs.forEach(function (t) {
          t.classList.toggle("is-active", t === tab);
          t.setAttribute("aria-selected", t === tab ? "true" : "false");
        });
        panels.forEach(function (panel) {
          panel.hidden = panel.getAttribute("data-cmd-panel") !== key;
        });
        captions.forEach(function (caption) {
          caption.hidden = caption.getAttribute("data-cmd-caption") !== key;
        });
      });
    });
  });

  /* ---- "See it in your terminal" deep link: scrolls to the demo section
     (native #demo anchor) and also selects the matching demo tab, so the
     visitor lands on the right output instead of always the first tab. ---- */
  Array.prototype.slice.call(document.querySelectorAll("[data-select-demo]")).forEach(function (link) {
    link.addEventListener("click", function () {
      var key = link.getAttribute("data-select-demo");
      var demoTab = document.querySelector('.tab[data-demo="' + key + '"]');
      if (demoTab) demoTab.click();
    });
  });

  /* ---- Screenshot modal: opens a full-size real asset only. No video or
     placeholder is wired up until a real one exists to show. ---- */
  var modalOverlay = document.getElementById("modal-overlay");
  var modalImg = document.getElementById("modal-img");
  var modalClose = document.getElementById("modal-close");
  if (modalOverlay && modalImg && modalClose) {
    var modalTrigger = null;

    function openModal(src, alt) {
      modalImg.src = src;
      modalImg.alt = alt || "";
      modalOverlay.hidden = false;
      document.body.style.overflow = "hidden";
      modalClose.focus();
    }
    function closeModal() {
      modalOverlay.hidden = true;
      modalImg.src = "";
      document.body.style.overflow = "";
      if (modalTrigger) modalTrigger.focus();
    }

    Array.prototype.slice.call(document.querySelectorAll("[data-modal-src]")).forEach(function (btn) {
      btn.addEventListener("click", function () {
        modalTrigger = btn;
        openModal(btn.getAttribute("data-modal-src"), btn.getAttribute("data-modal-alt"));
      });
    });
    modalClose.addEventListener("click", closeModal);
    modalOverlay.addEventListener("click", function (e) {
      if (e.target === modalOverlay) closeModal();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modalOverlay.hidden) closeModal();
    });
  }
})();
