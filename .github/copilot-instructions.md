# Copilot Instructions
## Project Overview
- Hugo static site hosted on GitHub Pages; custom theme in [themes/Paper++](themes/Paper++) extends PaperMod with animation hooks and rotating nav messaging.
- Content under [content/pages](content/pages) is curated from the Logseq graph; [public](public) contains generated HTML kept in-repo for Pages, so regenerate rather than hand-edit.
- Site configuration lives in [config.yml](config.yml) and drives theme features (navModule messages, social links, toggles); keep template IDs in sync with params expectations.
## Content Model & Linking
- Pages carry YAML front matter with date, category, tags, and lastMod fields; see [content/pages/Code Projects.md](content/pages/Code%20Projects.md) for a canonical example.
- Internal references should use Hugo ref/relref shortcodes so [layouts/partials/backlinks.html](layouts/partials/backlinks.html) can detect relationships by base filename.
- Logseq-styled callouts live in [layouts/shortcodes/logseq](layouts/shortcodes/logseq); open and close the shortcode pair exactly as existing content does to preserve formatting.
- Shared media belongs under [content/assets](content/assets) for Markdown embeds or [static](static) for global files to keep URLs stable across builds.
## Theme Customizations
- [layouts/_default/baseof.html](layouts/_default/baseof.html) seeds the page-transition class on &lt;html&gt;; tuning variables live in [themes/Paper++/assets/css/core/theme-vars.css](themes/Paper++/assets/css/core/theme-vars.css).
- [themes/Paper++/layouts/partials/header.html](themes/Paper++/layouts/partials/header.html) renders rotating status messages from params.navModule; the nav-message-rotator and change-animation IDs must remain intact for JS bindings.
- Theme toggle and Vanta controls assume the footer injects [layouts/partials/extend_footer.html](layouts/partials/extend_footer.html); altering button markup requires parallel updates in the bundled scripts.
- [layouts/partials/backlinks.html](layouts/partials/backlinks.html) builds backlinks by scanning RawContent; keep filenames and ref targets consistent because it matches on $.File.BaseFileName.
- Footer markup in [layouts/partials/extend_footer.html](layouts/partials/extend_footer.html) aggregates Vanta CDN scripts plus Hugo-piped bundles; honor fingerprint toggles via .Site.Params.assets.disableFingerprinting.
## JavaScript & Assets
- Hugo pipelines JS through resources.Get + js.Build; place new modules under [themes/Paper++/assets/js](themes/Paper++/assets/js) so [layouts/partials/extend_footer.html](layouts/partials/extend_footer.html) can bundle and fingerprint them.
- [themes/Paper++/assets/js/vanta-init.js](themes/Paper++/assets/js/vanta-init.js) manages background selection, nav message rotation, and animation cycling; it expects #top on <body> and persistent localStorage access.
- [themes/Paper++/assets/js/page-transitions.js](themes/Paper++/assets/js/page-transitions.js) reads --page-transition-duration from theme-vars, so adjust CSS variables instead of hardcoding durations.
- [themes/Paper++/assets/js/fastsearch.js](themes/Paper++/assets/js/fastsearch.js) consumes the Hugo-generated index.json exposed by the search shortcode in [layouts/shortcodes/search.html](layouts/shortcodes/search.html); preserve element IDs (searchbox, searchInput, searchResults).
- [js/links.js](js/links.js) is an ad-hoc Node utility; run it only after npm install if you need breadcrumb audits, but it is not part of the Hugo build.
## Build & Deployment
- Use Hugo Extended ≥0.83; local preview through hugo server -D mirrors the GitHub Actions build.
- Production builds use hugo --minify just like [.github/workflows/publish.yml](.github/workflows/publish.yml) before pushing to main or deploying artifacts.
- npm install hydrates dependencies (d3, three, vanta, @graphlab-fr/cosma) for local JS experimentation but is optional for pure Hugo work.
## Working Tips
- [tealblu.github.io-graph](tealblu.github.io-graph) is a separate Logseq repository ignored here; export or sync into [content](content) before rebuilding the site.
- [publicExport](publicExport) stores Logseq Schrödinger exports for reference—treat [content/pages](content/pages) as the editable source of truth.
- Prefer overriding theme behavior via [layouts/partials](layouts/partials) overrides in the project root to keep the Paper++ theme easy to update upstream.
