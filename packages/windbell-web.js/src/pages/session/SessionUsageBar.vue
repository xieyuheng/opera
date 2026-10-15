<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import type * as S from "@windbell/semiosis.js/core"
import { sessionMessages } from "./Session.i18n.ts"

const props = defineProps<{
  usage?: S.ModelUsage
  contextWindow?: number
}>()

const { t } = useI18n({
  messages: sessionMessages,
  useScope: "local",
})

const pointSize = 1_000
const maxPoints = 1_000

const usedTokens = computed(() => {
  if (props.usage === undefined) return 0
  return props.usage.input + props.usage.output
})

const usedPoints = computed(() => Math.floor(usedTokens.value / pointSize))

const totalPoints = computed(() => {
  if (props.contextWindow === undefined) return 0
  return Math.floor(props.contextWindow / pointSize)
})

const remainingPoints = computed(() =>
  Math.max(totalPoints.value - usedPoints.value, 0),
)

const fillPercent = computed(
  () => `${Math.min(remainingPoints.value / maxPoints, 1) * 100}%`,
)

const displayText = computed(() => `${usedPoints.value} / ${totalPoints.value}`)

function formatNumber(value: number): string {
  return value.toFixed(1).replace(/\.0$/, "")
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${formatNumber(tokens / 1_000_000)}M`
  if (tokens >= 1_000) return `${formatNumber(tokens / 1_000)}K`
  return String(tokens)
}

const contextUsageTitle = computed(() => {
  if (props.contextWindow === undefined) return undefined
  return `${t("contextUsage")}${formatTokens(usedTokens.value)} / ${formatTokens(props.contextWindow)}`
})
</script>

<template>
  <div
    class="pointer-events-auto bg-paper/60 relative flex w-64 items-center justify-center overflow-hidden border-3 border-sign-user"
    :title="contextUsageTitle"
  >
    <div
      class="absolute inset-y-0 left-0 bg-sign-user transition-[width] duration-200"
      :style="{ width: fillPercent }"
    />

    <span class="pointer-events-none relative z-10 font-mono text-ink text-sm">
      {{ displayText }}
    </span>
  </div>
</template>
