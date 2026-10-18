<script setup lang="ts">
import { computed } from "vue"
import type { RangerFileContent } from "../RangerContent.ts"

const props = defineProps<{
  content: RangerFileContent
}>()

const text = computed(() => new TextDecoder().decode(props.content.bytes))
</script>

<template>
  <div class="flex h-full min-h-0 flex-col overflow-hidden">
    <pre
      class="thin-scrollbar min-h-0 flex-1 overflow-auto px-4 py-3 font-mono text-ink"
      >{{ text }}</pre>
  </div>
</template>
