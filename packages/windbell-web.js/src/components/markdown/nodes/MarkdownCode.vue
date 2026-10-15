<script setup lang="ts">
import type { Code } from "mdast"
import type { MarkdownState } from "../markdownState.ts"

defineProps<{
  node: Code
  state: MarkdownState
}>()
</script>

<template>
  <pre
    class="my-4 overflow-x-auto rounded bg-ink/15 px-3 py-2 thin-scrollbar"
  ><code class="font-mono">{{ node.value }}</code></pre>
</template>
