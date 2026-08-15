// Landing-page behavior: the depth gauge, the Solutions menu, the per-row
// demo terminals, tabbed command groups, and the screenshot modal.
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

  /* ---- Solutions menu: click toggles (keyboard, touch); on devices with
     a real pointer, hovering the trigger opens it too. Escape, an outside
     click, or choosing an item closes it. ---- */
  Array.prototype.slice.call(document.querySelectorAll("[data-menu]")).forEach(function (menu) {
    var toggle = menu.querySelector(".menu-toggle");
    var panel = menu.querySelector(".menu-panel");
    if (!toggle || !panel) return;
    var closeTimer = null;
    var hoverOpened = false;

    function setOpen(open) {
      panel.hidden = !open;
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    }
    function cancelClose() {
      if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
    }

    toggle.addEventListener("click", function () {
      // If hover already opened it, the first click confirms rather than
      // toggles, so a mouse user never sees the panel flash shut.
      if (hoverOpened) { hoverOpened = false; setOpen(true); return; }
      setOpen(panel.hidden);
    });
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      menu.addEventListener("mouseenter", function () {
        cancelClose();
        if (panel.hidden) { hoverOpened = true; setOpen(true); }
      });
      menu.addEventListener("mouseleave", function () {
        cancelClose();
        closeTimer = setTimeout(function () { hoverOpened = false; setOpen(false); }, 220);
      });
    }
    Array.prototype.slice.call(panel.querySelectorAll("a")).forEach(function (item) {
      item.addEventListener("click", function () { setOpen(false); });
    });
    document.addEventListener("click", function (e) {
      if (!panel.hidden && !menu.contains(e.target)) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) {
        setOpen(false);
        toggle.focus();
      }
    });
    // Close when focus leaves the menu entirely (tabbing past the last item).
    menu.addEventListener("focusout", function (e) {
      if (!menu.contains(e.relatedTarget)) setOpen(false);
    });
  });

  /* ---- Demo terminals: one per product row. Each types the real
     command and reveals the real captured output, starting when it
     scrolls into view. ---- */
  var demos = window.SECCHI_DEMOS || {};

  function esc(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function renderStatic(body, demo) {
    var html = '<span class="prompt">$ </span><span class="tcmd">' + esc(demo.command) + "</span>\n";
    html += demo.lines.map(function (line) { return esc(line); }).join("\n");
    if (demo.command2) {
      html += '\n\n<span class="prompt">$ </span><span class="tcmd">' + esc(demo.command2) + "</span>\n";
      html += demo.lines2.map(function (line) { return esc(line); }).join("\n");
    }
    body.innerHTML = html;
  }

  function typeCommand(body, command, done) {
    var i = 0;
    var cmdSpan = document.createElement("span");
    cmdSpan.className = "tcmd";
    var cursor = document.createElement("span");
    cursor.className = "cursor";
    var prompt = document.createElement("span");
    prompt.className = "prompt";
    prompt.textContent = "$ ";
    body.appendChild(prompt);
    body.appendChild(cmdSpan);
    body.appendChild(cursor);

    (function step() {
      if (i < command.length) {
        cmdSpan.textContent += command.charAt(i);
        i += 1;
        setTimeout(step, 34);
      } else {
        setTimeout(function () {
          cursor.remove();
          body.appendChild(document.createTextNode("\n"));
          done();
        }, 260);
      }
    })();
  }

  function revealLines(body, lines, done) {
    var i = 0;
    (function step() {
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

  function play(terminal) {
    var key = terminal.getAttribute("data-terminal");
    var body = terminal.querySelector(".terminal-body");
    var demo = demos[key];
    if (!demo || !body) return;
    terminal.setAttribute("data-active", key);
    body.innerHTML = "";
    if (reducedMotion) {
      renderStatic(body, demo);
      return;
    }
    typeCommand(body, demo.command, function () {
      revealLines(body, demo.lines, function () {
        if (!demo.command2) return;
        body.appendChild(document.createTextNode("\n"));
        typeCommand(body, demo.command2, function () {
          revealLines(body, demo.lines2, null);
        });
      });
    });
  }

  Array.prototype.slice.call(document.querySelectorAll("[data-terminal]")).forEach(function (terminal) {
    var started = false;
    function start() {
      if (started) return;
      started = true;
      play(terminal);
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries, observer) {
        if (entries.some(function (entry) { return entry.isIntersecting; })) {
          observer.disconnect();
          start();
        }
      }, { threshold: 0.3 }).observe(terminal);
    } else {
      start();
    }
  });

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

  /* ---- Preview modal. Three sources, all real: a screenshot asset
     (data-modal-src), the captured demo output rendered in full
     (data-modal-demo, independent of the row terminal's animation
     state), or the text of an existing <pre> on the page
     (data-modal-from, e.g. the agent concept sketch). ---- */
  var modalOverlay = document.getElementById("modal-overlay");
  var modalImg = document.getElementById("modal-img");
  var modalPre = document.getElementById("modal-pre");
  var modalCaption = document.getElementById("modal-caption");
  var modalClose = document.getElementById("modal-close");
  if (modalOverlay && modalImg && modalPre && modalCaption && modalClose) {
    var modalTrigger = null;

    function openModal(opts) {
      modalImg.hidden = !opts.src;
      modalPre.hidden = !!opts.src;
      if (opts.src) {
        modalImg.src = opts.src;
        modalImg.alt = opts.alt || "";
      } else {
        modalPre.innerHTML = opts.html || "";
        modalPre.setAttribute("aria-label", opts.alt || "");
      }
      modalCaption.textContent = opts.caption || "";
      modalCaption.hidden = !opts.caption;
      modalOverlay.hidden = false;
      document.body.style.overflow = "hidden";
      modalClose.focus();
    }
    function closeModal() {
      modalOverlay.hidden = true;
      modalImg.src = "";
      modalPre.innerHTML = "";
      modalCaption.textContent = "";
      document.body.style.overflow = "";
      if (modalTrigger) modalTrigger.focus();
    }

    Array.prototype.slice.call(document.querySelectorAll("[data-modal-src], [data-modal-demo], [data-modal-from]")).forEach(function (btn) {
      btn.addEventListener("click", function () {
        modalTrigger = btn;
        var opts = { alt: btn.getAttribute("data-modal-alt"), caption: btn.getAttribute("data-modal-caption") };
        if (btn.hasAttribute("data-modal-src")) {
          opts.src = btn.getAttribute("data-modal-src");
        } else if (btn.hasAttribute("data-modal-demo")) {
          var demo = demos[btn.getAttribute("data-modal-demo")];
          if (!demo) return;
          var scratch = document.createElement("pre");
          renderStatic(scratch, demo);
          opts.html = scratch.innerHTML;
        } else {
          var source = document.querySelector(btn.getAttribute("data-modal-from"));
          if (!source) return;
          opts.html = esc(source.textContent);
        }
        openModal(opts);
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
