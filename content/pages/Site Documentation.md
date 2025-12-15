---
date: 2025-12-15
category: projects
keywords: projects, code, coding
title: Site Documentation
tags:
- digital garden
- website
- tealblu.github.io
- indi.bio
categories: projects
lastMod: 2025-02-14
---
*documentation for https://indi.bio/ (and https://tealblu.github.io/)*

# TLDR
This is a Hugo Extended (≥0.83) static site for GitHub Pages using the Paper++ custom theme (PaperMod derivative) with Vanta backgrounds and animation hooks, Three.js/D3 for visuals, Hugo-piped JS/CSS assets (themes/Paper++/assets/js) including vanta-init.js, page-transitions.js and fastsearch.js, Logseq-synced content under content/pages and content/assets, search via a prebuilt index consumed by fastsearch, and production builds via hugo --minify (npm install is optional for JS deps).

Refer to the [ReadMe](https://github.com/tealblu/tealblu.github.io/blob/main/README.md) if you don't want to read the rest.

# Content
- Source: content/pages (Logseq-synced); public contains generated HTML (regenerate, don't hand-edit).
- Media: content/assets for page-scoped media, static/ for global files.
- Keep filenames stable — backlinks & shortcodes match on $.File.BaseFileName.
- Use YAML front matter: date, category, tags, lastMod (see content/pages/Code Projects.md).
- Internal links: use ref/relref shortcodes so layouts/partials/backlinks.html can detect relationships.
- Logseq callouts: use layouts/shortcodes/logseq open/close pairs exactly as existing content.

# Templating
- Base template: layouts/_default/baseof.html (seeds page-transition class on <html>).
- Header rotator IDs (nav-message-rotator, change-animation) must remain for JS bindings (themes/Paper++/layouts/partials/header.html).
- Footer injection and asset bundles come from layouts/partials/extend_footer.html.

# Theme Customizations
- Theme root: themes/Paper++ (PaperMod derivative).
- Tweak variables in themes/Paper++/assets/css/core/theme-vars.css (avoid hardcoding durations in JS).
- Honor .Site.Params.assets.disableFingerprinting when altering extend_footer.html or asset pipelines.

# Style & Transitions
- Page transitions controlled by --page-transition-duration in theme-vars.css; page-transitions.js reads this value.

# Animations & Vanta
- Vanta backgrounds and nav/message animation cycling managed by themes/Paper++/assets/js/vanta-init.js.
- vanta-init.js expects #top on <body> and persistent localStorage for state.
- Footer must include Vanta CDN + bundled scripts; maintain button markup consumed by scripts.

# JavaScript & Assets
- Place new modules under themes/Paper++/assets/js so Hugo pipelines (resources.Get + js.Build) can bundle/fingerprint them.
- Key scripts: vanta-init.js, page-transitions.js, fastsearch.js.
- fastsearch.js consumes the Hugo-generated index.json from layouts/shortcodes/search.html; preserve IDs (searchbox, searchInput, searchResults).

# Search & Backlinks
- Generate search index via shortcode in layouts/shortcodes/search.html; fastsearch consumes it client-side.
- Backlinks built from RawContent via layouts/partials/backlinks.html — keep ref targets and filenames consistent.

# Build & Deployment
- Use Hugo Extended ≥0.83. Local preview: hugo server -D.
- Production: hugo --minify (GitHub Actions builds mirror this; see .github/workflows/publish.yml).
- npm install is optional (d3, three, vanta, @graphlab-fr/cosma) for local JS experiments only.

# Utilities & Extras
- publicExport contains Logseq exports for reference; content/pages is the source of truth.
- Keep config.yml in sync with template IDs and params (navModule messages, social links, toggles).

# Contribution Notes
- Regenerate public when content changes; avoid committing hand-edited HTML.
- Maintain consistent IDs and filenames — JS and partials depend on them.
- Document changes to theme-vars.css and extend_footer.html when adding assets or altering fingerprinting.

# More info
- For more, please see the [github repo for this project](https://github.com/tealblu/tealblu.github.io/).