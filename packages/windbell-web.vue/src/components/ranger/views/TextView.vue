<script setup lang="ts">
import { computed } from "vue"

import type { RangerFileContent } from "../RangerContent.ts"
import { resolveFileLanguage } from "./fileLanguage.ts"
import HighlightedText from "./HighlightedText.vue"

const props = defineProps<{
  content: RangerFileContent
}>()

const text = computed(() => new TextDecoder().decode(props.content.bytes))
const language = computed(() => resolveFileLanguage(props.content.path))
</script>

<template>
  <div class="flex h-full min-h-0 flex-col overflow-hidden">
    <pre
      class="text-ink min-h-0 flex-1 overflow-auto px-4 py-3 font-mono"
    ><HighlightedText
        :text="text"
        :language="language"
      /></pre>
  </div>
</template>
