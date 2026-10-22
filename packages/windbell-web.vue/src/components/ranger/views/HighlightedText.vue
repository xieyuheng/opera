<script setup lang="ts">
import {
  HighlightedCodeView,
  highlightCode,
  type HighlightedCode,
} from "@xieyuheng/markdown.vue"
import { shallowRef, watch } from "vue"

const props = defineProps<{
  text: string
  language?: string
}>()

const highlighted = shallowRef<HighlightedCode>()

watch(
  [() => props.text, () => props.language],
  async ([text, language], _previous, onCleanup) => {
    let active = true
    onCleanup(() => {
      active = false
    })

    highlighted.value = undefined

    if (language === undefined) return

    const tokens = await highlightCode(text, language)
    if (active) {
      highlighted.value = tokens
    }
  },
  { immediate: true },
)
</script>

<template>
  <HighlightedCodeView v-if="highlighted !== undefined" :tokens="highlighted" />
  <code v-else>{{ text }}</code>
</template>
