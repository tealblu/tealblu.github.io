<h1 align="center">
    indi.bio
</h1>

<p align="center">
    <img
        alt="HTML"
        src="https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white">
    <a href="https://logseq.com/#/">
    <img
        alt="Logseq"
        src="https://img.shields.io/static/v1?label=&message=LOGSEQ&color=002B35&style=for-the-badge">
    </a>
    <a href="https://gohugo.io/">
    <img
        alt="Hugo"
        src="https://img.shields.io/badge/Hugo-black.svg?style=for-the-badge&logo=Hugo">
    </a>
    <img
        alt="Markdown"
        src="https://img.shields.io/badge/markdown-%23000000.svg?style=for-the-badge&logo=markdown&logoColor=white">
</a>

## Description

This is a [HUGO](https://gohugo.io/) website for my [Logseq](https://logseq.com/#/) notes graph, using [GitHub Pages](https://pages.github.com/) to host the website, [logseq-schrodinger](https://github.com/sawhney17/logseq-schrodinger) to export the Logseq pages, and [utterances](https://utteranc.es/) to manage comments.

![how i feel using this setup](./src/thanos_logseq_hugo.svg)

## 🧱 Projects Structure

```bash
├── archetypes/
│   └── default.md
├── content/    # Where content is stored
│   ├── assets/    # Things from LogseqGraph/assets, used in posts.
│   │   └── test.png
│   ├── pages/    # Revised Logseq pages with metadata sections for Hugo.
│   │   └── random page from logseq.md
│   ├── archives.md
│   └── search.md
├── .github/    # Define GitHub action to help deploy in one click.
│   └── workflows/
│       └── publish.yml
├── layouts/    # Layout definitions
│   ├── partials/
│   │   └── backlinks.html    # Simulate backlinks function in Hugo.
│   └── shortcodes/
│       ├── logseq/    # Translation between Logseq and Hugo.
│       │   ├── mark.html
│       │   ├── orgCAUTION.html
│       │   ├── orgEXAMPLE.html
│       │   ├── orgIMPORTANT.html
│       │   ├── orgNOTE.html
│       │   ├── orgPINNED.html
│       │   ├── orgQUOTE.html
│       │   ├── orgTIP.html
│       │   └── orgWARNING.html
│       ├── contact.html
│       ├── hint.html
│       └── search.html
├── themes/
│   └── random-theme/   # In this repo, PaperMod is the default theme.
├── config.yml    # The main settings page for the website.
└── .gitignore    # This is to prevent unwanted files be tracked by Git.
```

## Issues

[Issues for this project](https://github.com/tealblu/tealblu.github.io/issues)

[Issues for logseq-schrodinger](https://github.com/sawhney17/logseq-schrodinger#issues)

## License

Distributed under the MIT License. See `LICENSE` for more information.
