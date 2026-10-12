<script setup lang="ts">
import type { FileSystemEntry } from "@windbell/fs.js/fs"
import { computed, nextTick, ref, watch } from "vue"
import { isSamePath } from "./RangerPath.ts"

const props = defineProps<{
  root: string
  currentDirectory: string
  entries: Array<FileSystemEntry>
  selectedIndex: number
  focus: "sidebar" | "view"
}>()

const emit = defineEmits<{
  select: [index: number]
  goParent: []
}>()

const list = ref<HTMLOListElement | null>(null)

watch(
  () => props.selectedIndex,
  async (index) => {
    await nextTick()

    const item = list.value?.children[index] as HTMLElement | undefined
    item?.scrollIntoView({ block: "nearest" })
  },
)

const currentName = computed(() => {
  return pathName(props.currentDirectory || props.root)
})

const canGoParent = computed(() => {
  const directory = props.currentDirectory || props.root

  return directory !== "" && !isSamePath(directory, props.root)
})

function pathName(value: string): string {
  const trimmed = value.replace(/[/\\]+$/, "")
  const index = Math.max(trimmed.lastIndexOf("/"), trimmed.lastIndexOf("\\"))

  return (index === -1 ? trimmed : trimmed.slice(index + 1)) || "/"
}
</script>

<template>
  <aside class="flex h-full min-h-0 flex-col overflow-hidden bg-paper">
    <header class="shrink-0">
      <button
        type="button"
        class="block w-full truncate px-3 py-2 text-left text-ink transition-colors"
        :class="canGoParent ? 'cursor-pointer hover:bg-line' : 'cursor-default'"
        :disabled="!canGoParent"
        @click="emit('goParent')"
      >
        {{ currentName }}
      </button>
    </header>

    <ol
      ref="list"
      class="thin-scrollbar min-h-0 flex-1 overflow-y-auto border-t border-line"
    >
      <li
        v-for="(entry, index) in entries"
        :key="entry.path"
        class="w-full cursor-pointer truncate px-3 py-1"
        :class="[
          index === selectedIndex
            ? focus === 'sidebar'
              ? 'bg-ink text-paper'
              : 'bg-ink/15 text-ink'
            : 'text-ink hover:bg-line',
        ]"
        @click="emit('select', index)"
      >
        {{ entry.kind === "Directory" ? `${entry.name}/` : entry.name }}
      </li>
    </ol>
  </aside>
</template>
