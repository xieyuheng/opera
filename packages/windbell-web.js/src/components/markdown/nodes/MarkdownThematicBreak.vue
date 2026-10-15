<script setup lang="ts">
import type { ThematicBreak } from "mdast"
import type { MarkdownState } from "../markdownState.ts"

defineProps<{
  node: ThematicBreak
  state: MarkdownState
}>()
</script>

<template>
  <hr class="my-6 border-ink" />
</template>
