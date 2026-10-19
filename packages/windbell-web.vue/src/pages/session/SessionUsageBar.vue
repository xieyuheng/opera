<script setup lang="ts">
import type * as S from "@windbell/semiosis.ts/core"
import { computed } from "vue"
import { useI18n } from "vue-i18n"

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

const displayText = computed(
  () => `${remainingPoints.value} / ${totalPoints.value}`,
)

function formatNumber(value: number): string {
  return value.toFixed(1).replace(/\.0$/, "")
}

function formatContextTokens(tokens: number): string {
  return formatNumber(tokens / 1_000)
}

const contextUsageTitle = computed(() => {
  if (props.contextWindow === undefined) return undefined

  return t("contextUsageTitle", {
    usage: formatContextTokens(usedTokens.value),
    remaining: formatContextTokens(
      Math.max(props.contextWindow - usedTokens.value, 0),
    ),
    limit: formatContextTokens(props.contextWindow),
  })
})
</script>

<template>
  <div
    class="bg-paper/60 border-sign-user pointer-events-auto relative flex w-60 items-center justify-center overflow-hidden border-3"
    :title="contextUsageTitle"
  >
    <div
      class="bg-sign-user absolute inset-y-0 left-0 transition-[width] duration-200"
      :style="{ width: fillPercent }"
    />

    <span class="text-ink pointer-events-none relative z-10 font-mono text-sm">
      {{ displayText }}
    </span>
  </div>
</template>
