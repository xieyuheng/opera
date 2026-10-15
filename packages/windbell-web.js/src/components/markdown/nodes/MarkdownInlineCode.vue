<script setup lang="ts">
import type { InlineCode } from "mdast"
import type { MarkdownState } from "../markdownState.ts"

defineProps<{
  node: InlineCode
  state: MarkdownState
}>()
</script>

<template>
  <code class="rounded px-1.5 py-0.5 bg-ink/15 font-mono">{{ node.value }}</code>
</template>
