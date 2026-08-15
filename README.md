# secchi-website

The landing page for [secchi.dev](https://secchi.dev) — Secchi, the
product signals platform for DevTools and agents. Product documentation does not live
here; it stays in the [secchi](https://github.com/kannandreams/secchi)
repository and is published at docs.secchi.dev.

## How this site works

Static files, no build step, no framework, no external requests at
runtime. Fonts are self-hosted woff2. Edit a file, push to main, and the
Deploy workflow publishes the repository root to GitHub Pages as-is.

```
index.html          the page
css/site.css        all styles; design tokens at the top
js/main.js          depth gauge, Solutions menu, per-row demo terminals (vanilla JS)
data/demo.js        captured real command output for the demo terminals
fonts/              Space Grotesk (titles), JetBrains Mono (everything else;
                    *-symbols.woff2 = box-drawing/arrows/shapes subsets)
assets/             logo, dashboard screenshot, secchi-og.png (social share image)
<page>/index.html   redirect stubs for pre-split secchi.dev/<page> URLs
favicon.svg,        favicon set: SVG (modern browsers) + ICO/PNG
favicon*.png/.ico,  fallbacks (older Safari, search results, iOS/Android
site.webmanifest    home-screen icons), generated from favicon.svg
```

Design rules, enforced by the tokens in `css/site.css`: black and white
base; acid green `#7CFFB2` marks ecosystem / package signals, amber
`#FFB000` marks product usage signals (a nod to green- and amber-phosphor
terminal monitors), violet `#C084FC` marks agent signals, electric blue
`#22D3EE` marks interaction (links, buttons, focus) — each color has
exactly one job. No rounded
corners. All motion is disabled under `prefers-reduced-motion`.

The demo terminals show real captured output only. To refresh it, run the
actual tools and paste their output into `data/demo.js`; the capture
recipe is in that file's header comment. Do not edit numbers by hand.

## Local preview

Open `index.html` in a browser, or serve the directory:

```bash
python3 -m http.server 8080
```

## Domain runbook (one-time move of secchi.dev)

The docs and the landing page used to share secchi.dev from the secchi
repo. To complete the split:

1. Push this repository to GitHub and enable Pages
   (Settings → Pages → Source: GitHub Actions). Let the Deploy workflow
   run once.
2. In the **secchi** repo's Pages settings: remove the custom domain
   `secchi.dev`, then set it to `docs.secchi.dev`. Add a DNS CNAME record
   `docs` → `kannandreams.github.io`. Wait for the certificate, then
   enable "Enforce HTTPS".
3. In **this** repo's Pages settings: set the custom domain to
   `secchi.dev` (and `www.secchi.dev`). The apex DNS records already
   point at GitHub Pages and do not change. Wait for the certificate,
   then enable "Enforce HTTPS" (it was never enabled on the old site —
   turn it on).
4. Verify: secchi.dev shows the landing page; docs.secchi.dev shows the
   docs; secchi.dev/getting-started/ redirects to
   docs.secchi.dev/getting-started/ (this URL is published on PyPI, so
   the stub matters).

Do step 2 before step 3 so documentation links are broken for minutes,
not hours.

## License

Apache-2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
