<script setup lang="ts">
import { ref } from "vue"

import Markdown from "../src/index.ts"

const source = ref(
  [
    "---",
    "title: Windbell Markdown",
    "authors: [Windbell, Example]",
    "date: 2025-10-19",
    "---",
    "",
    "# Markdown preview",
    "",
    "This page renders **Markdown** from the extracted component package.",
    "",
    "> Edit the source on the left and the preview updates immediately.",
    "",
    "## Features",
    "",
    "- GFM tables",
    "- Task lists",
    "- Footnotes[^1]",
    "- Fenced code blocks",
    "",
    "| Feature | Status |",
    "| --- | --- |",
    "| Frontmatter | ✓ |",
    "| GFM | ✓ |",
    "| Source package | ✓ |",
    "",
    "- [x] GFM parsing",
    "- [x] Reusable component",
    "- [ ] Publish package",
    "",
    '```ts title="dev/example.ts"',
    'import Markdown from "@windbell/markdown.vue"',
    "",
    "const text = ref('# Hello')",
    "```",
    "",
    "Visit [Tailwind CSS](https://tailwindcss.com) or check an image:",
    "",
    "![Windbell](https://placehold.co/640x160?text=Windbell)",
    "",
    "[^1]: Footnotes are collected and numbered automatically.",
  ].join("\n"),
)
</script>

<template>
  <article class=" p-6">
    <Markdown :text="source" />
  </article>
</template>
