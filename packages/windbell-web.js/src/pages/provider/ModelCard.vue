<script setup lang="ts">
import type { ProviderModelEntry } from "@windbell/semiosis.js"
import DeepSeekModelCard from "./DeepSeekModelCard.vue"
import OpenRouterModelCard from "./OpenRouterModelCard.vue"

defineProps<{
  entry: ProviderModelEntry
  busy: boolean
}>()

const emit = defineEmits<{
  pin: []
  unpin: []
  setDefault: []
}>()
</script>

<template>
  <DeepSeekModelCard
    v-if="entry.providerName === 'deepseek'"
    :entry="entry"
    :busy="busy"
    @pin="emit('pin')"
    @unpin="emit('unpin')"
    @set-default="emit('setDefault')"
  />

  <OpenRouterModelCard
    v-else-if="entry.providerName === 'openrouter'"
    :entry="entry"
    :busy="busy"
    @pin="emit('pin')"
    @unpin="emit('unpin')"
    @set-default="emit('setDefault')"
  />
</template>
