<script setup lang="ts">
import { computed, ref, watch } from "vue"
import Markdown from "../../markdown/Markdown.vue"
import type { RangerFileContent } from "../RangerContent.ts"
import MarkdownToolbar from "./MarkdownToolbar.vue"
import {
  readStoredMarkdownViewMode,
  writeStoredMarkdownViewMode,
  type MarkdownViewMode,
} from "./MarkdownViewMode.ts"

const props = defineProps<{
  content: RangerFileContent
}>()

const text = computed(() => new TextDecoder().decode(props.content.bytes))
const mode = ref<MarkdownViewMode>(readStoredMarkdownViewMode())

function toggleMode(): void {
  mode.value = mode.value === "render" ? "source" : "render"
}

watch(mode, (value) => {
  writeStoredMarkdownViewMode(value)
})
</script>

<template>
  <div class="relative flex h-full min-h-0 flex-col overflow-hidden">
    <MarkdownToolbar
      class="absolute right-3 top-3 z-10"
      :mode="mode"
      @toggle="toggleMode"
    />

    <div class="min-h-0 flex-1 overflow-auto px-4 py-3 thin-scrollbar">
      <Markdown v-if="mode === 'render'" :text="text" />

      <pre
        v-else
        class="m-0 font-mono whitespace-pre-wrap break-words text-ink"
        >{{ text }}</pre>
    </div>
  </div>
</template>
