<script setup lang="ts">
import type { InlineCode } from "mdast"
import type { MarkdownState } from "../markdownState.ts"

defineProps<{
  node: InlineCode
  state: MarkdownState
}>()
</script>

<template>
  <code class="rounded border border-ink/30 px-1.5 bg-ink/15 font-mono">{{ node.value }}</code>
</template>
