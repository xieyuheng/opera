<script setup lang="ts">
import { computed } from "vue"
import type * as S from "@windbell/semiosis.js/core"

const props = defineProps<{
  usage?: S.ModelUsage
  contextWindow?: number
}>()

const scale = 1_000_000

const usedTokens = computed(() => {
  if (props.usage === undefined) return 0
  return props.usage.input + props.usage.output
})

const remainingTokens = computed(() => {
  if (props.contextWindow === undefined) return 0
  return Math.max(props.contextWindow - usedTokens.value, 0)
})

const fillPercent = computed(
  () => `${Math.min(remainingTokens.value / scale, 1) * 100}%`,
)
</script>

<template>
  <div
    class="relative h-6 w-64 overflow-hidden border-3 border-sign-user"
    :title="`${remainingTokens} / ${props.contextWindow ?? 0}`"
  >
    <div
      class="h-full bg-sign-user transition-[width] duration-200"
      :style="{ width: fillPercent }"
    />
  </div>
</template>
