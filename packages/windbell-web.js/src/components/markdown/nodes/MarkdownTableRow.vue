<script setup lang="ts">
import type { TableRow } from "mdast"
import MarkdownNode from "../MarkdownNode.vue"
import type { MarkdownState } from "../markdownState.ts"

defineProps<{
  node: TableRow
  state: MarkdownState
}>()
</script>

<template>
  <tr class="border-b border-ink">
    <MarkdownNode
      v-for="(child, index) in node.children"
      :key="index"
      :node="child"
      :state="state"
    />
  </tr>
</template>
