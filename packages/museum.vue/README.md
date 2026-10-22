# @xieyuheng/museum.vue

A Vue component that renders a curated tree of Markdown documents.

The component owns curation parsing, page lookup, Markdown loading, relative
link resolution, and the ranger-like navigation. Routing is left to the host
application.

## Props

- `contentBaseUrl: string` — public URL prefix containing the `curation` file.
- `name?: string` — current curation node name.
- `makeHref?: (name: string) => string` — optional host URL builder for links.

## Events

- `navigate(name: string)` — the user selected a curation node.

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
