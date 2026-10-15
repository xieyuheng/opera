<script setup lang="ts">
import type { Blockquote } from "mdast"
import MarkdownNode from "../MarkdownNode.vue"
import type { MarkdownState } from "../markdownState.ts"

defineProps<{
  node: Blockquote
  state: MarkdownState
}>()
</script>

<template>
  <blockquote class="my-3 border-l-3 border-ink/60 pl-4 text-ink">
    <MarkdownNode
      v-for="(child, index) in node.children"
      :key="index"
      :node="child"
      :state="state"
    />
  </blockquote>
</template>
