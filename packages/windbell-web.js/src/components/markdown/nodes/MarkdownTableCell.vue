<script setup lang="ts">
import type { TableCell } from "mdast"
import MarkdownNode from "../MarkdownNode.vue"
import type { MarkdownState } from "../markdownState.ts"

defineProps<{
  node: TableCell
  state: MarkdownState
}>()
</script>

<template>
  <td class="border border-ink px-2 py-1 align-top">
    <MarkdownNode
      v-for="(child, index) in node.children"
      :key="index"
      :node="child"
      :state="state"
    />
  </td>
</template>
