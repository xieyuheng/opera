<script setup lang="ts">
import type { CurationNode } from "../curation/index.ts"
import type { MuseumNavColumn } from "./MuseumState.ts"

const props = defineProps<{
  current: CurationNode
  columns: Array<MuseumNavColumn>
  makeHref?: (name: string) => string
}>()

const emit = defineEmits<{
  navigate: [name: string]
}>()

function hrefFor(name: string): string {
  return props.makeHref?.(name) ?? `/${encodeURIComponent(name)}`
}

function isCurrent(node: CurationNode): boolean {
  return node === props.current
}

function isParent(node: CurationNode): boolean {
  return node === props.current.parent
}
</script>

<template>
  <nav class="flex flex-row gap-6">
    <ul v-for="column in columns" class="flex flex-col" :key="column.key">
      <li v-for="node in column.nodes" :key="node.name">
        <a
          :href="hrefFor(node.name)"
          :class="{
            underline: isCurrent(node) || isParent(node),
          }"
          @click.prevent="emit('navigate', node.name)"
        >
          {{ node.name }}
        </a>
      </li>
    </ul>
  </nav>
</template>
