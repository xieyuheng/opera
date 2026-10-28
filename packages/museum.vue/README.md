# @xieyuheng/museum.vue

A Vue component that renders a curated tree of Markdown and HTML documents.

The component owns curation parsing, page lookup, document loading, relative
link resolution, and the ranger-like navigation. Routing is left to the host
application.

## Props

- `contentBaseUrl: string` — public URL prefix containing the `curation` file.
- `name?: string` — current curation node name.
- `makeHref?: (name: string) => string` — optional host URL builder for links.

## Events

- `navigate(name: string)` — the user selected a curation node.

## Cover image

A Markdown document can declare a page cover image in frontmatter. The image is
rendered after the logo and navigation, but before the document title and body.

```yaml
---
title: 怀仁集王羲之圣教序
cover-image:
  src: ../assets/images/书法字帖/怀仁集王羲之圣教序/01.png
  alt: 怀仁集王羲之圣教序
  max-width: 800px
---
```

- `src` is optional. Without it, no cover is rendered.
- `alt` is optional and falls back to the frontmatter `title`.
- `max-width` is optional and accepts a CSS length. Without it, the image uses
  the museum content width (`43rem`).
- `src` is resolved relative to the Markdown document URL.

The cover spans the full content width without horizontal padding. When a
custom `max-width` is smaller than the viewport, the cover remains left-aligned.

## HTML documents

Museum pages may use `.html` files. `.htm` is also accepted as an alias.

An HTML document is treated as a fragment rendered inside a full-width host.
Unlike Markdown, Museum does not apply a content width or horizontal padding;
the HTML document owns its own layout. The application header, logo, and
navigation are still owned by Museum. The fragment may contain multiple
top-level elements and its own `<style>` element.

```html
<article class="exhibit-calligraphy">
  <img
    src="../assets/images/calligraphy/01.png"
    alt="Calligraphy"
  />
  <style>
    .exhibit-calligraphy img {
      max-width: 100%;
      height: auto;
    }
  </style>
</article>
```

Relative `action`, `href`, `poster`, `src`, and `xlink:href` attributes are
resolved against the HTML document URL. Relative URLs inside `<style>` blocks
and inline `style` attributes are resolved the same way.

HTML files are trusted content. Museum does not sanitize them, and it does not
rewrite author-provided attributes such as `target` or `rel`.

Typography is owned by the HTML document itself. The museum only provides a
full-width wrapper. Style selectors inside the document should be scoped by a
unique root class to avoid affecting the application or other pages.

## Styles

```ts
import "@xieyuheng/museum.vue/styles/index.css"
```

## Minimal usage

```vue
<script setup lang="ts">
import { Museum } from "@xieyuheng/museum.vue"
</script>

<template>
  <Museum content-base-url="/files/" :name="name" @navigate="navigate" />
</template>
```

The content directory must contain a `curation` file.

```text
# comments and blank lines are ignored
0 首页 index.md
1 笔记 notes/hello.md
1 关于 about.md
2 子页 notes/child.md
```

Rules:

- `depth` starts at `0` and must not jump.
- `name` is the navigation label and host routing key; it must be unique.
- Neither `name` nor `path` may contain whitespace.
- Name must not contain `/`, `?`, `#`, or `%`.
- `path` is resolved relative to the curation file URL.
