---
date: 2024-02-18
keywords: development, javascript, graph
title: Graph Rendering
tags:
categories:
lastMod: 2025-02-14
---
### Project goals:

  + Create an interactive "graph view" of this website to display on its homepage.

  + Make it compatible with github pages and hugo's static site specifications.

### Research:

  + [Plotly with Hugo](https://mertbakir.gitlab.io/hugo/plotly-with-hugo/)

  + [Logseq codebase overview](https://github.com/logseq/logseq/blob/master/CODEBASE_OVERVIEW.md)

  + [Article on logseq codebase structure](https://docs.logseq.com/#/page/The%20Refactoring%20Of%20Logseq)

  + [Logseq built-in renderer](https://github.com/logseq/logseq/blob/master/src/main/frontend/extensions/graph/pixi.cljs)

  + [Cosma | Installing Cosma (arthurperret.fr)](https://cosma.arthurperret.fr/installing.html)

  + [Logseq Graph Analysis plugin](https://github.com/trashhalo/logseq-graph-analysis/blob/main/src/main.ts)

### Development

  + `themes/Paper++/layouts/partials/home_info.html` is the template for my home page

    + I need to figure out how to render a graph in this page

    + JavaScript parser returns map containing all links

    + Map contents:

![image.png](/assets/image_1708282777080_0.png)

    + JavaScript renderer renders everything
