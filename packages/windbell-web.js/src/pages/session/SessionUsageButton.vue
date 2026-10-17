<script setup lang="ts">
import { computed, reactive, ref } from "vue"
import { useI18n } from "vue-i18n"
import type * as S from "@windbell/semiosis.js/core"
import MediumButton from "../../components/buttons/MediumButton.vue"
import Card from "../../components/card/Card.vue"
import { sessionMessages } from "./Session.i18n.ts"

const props = defineProps<{
  totalUsage: S.ModelTotalUsage
}>()

const { t } = useI18n({
  messages: sessionMessages,
  useScope: "local",
})

const popoverId = `session-usage-${Math.random().toString(36).slice(2)}`
const anchor = ref<HTMLElement | null>(null)
const popover = ref<HTMLElement | null>(null)
const position = reactive({
  left: "0px",
  top: "0px",
})

const totalTokens = computed(() => props.totalUsage.total)

const cacheHitRate = computed(() => {
  if (props.totalUsage.input === 0) return 0
  return props.totalUsage.cacheRead / props.totalUsage.input
})

function formatNumber(value: number): string {
  return value.toFixed(1).replace(/\.0$/, "")
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${formatNumber(tokens / 1_000_000)}M`
  if (tokens >= 1_000) return `${formatNumber(tokens / 1_000)}K`
  return String(tokens)
}

function formatPercent(rate: number): string {
  return `${formatNumber(rate * 100)}%`
}

const summaryText = computed(
  () =>
    `${formatTokens(totalTokens.value)} · ${formatPercent(cacheHitRate.value)}`,
)

const summaryTitle = computed(() =>
  t("usageSummaryTitle", {
    tokens: formatTokens(totalTokens.value),
    rate: formatPercent(cacheHitRate.value),
  }),
)

function positionPopover(): void {
  const anchorElement = anchor.value
  const popoverElement = popover.value
  if (anchorElement === null || popoverElement === null) return

  const anchorRect = anchorElement.getBoundingClientRect()
  const popoverRect = popoverElement.getBoundingClientRect()

  let left = anchorRect.left
  let top = anchorRect.bottom + 8

  if (left + popoverRect.width > window.innerWidth - 8) {
    left = window.innerWidth - popoverRect.width - 8
  }

  if (top + popoverRect.height > window.innerHeight - 8) {
    top = anchorRect.top - popoverRect.height - 8
  }

  position.left = `${Math.max(8, left)}px`
  position.top = `${Math.max(8, top)}px`
}

function handleToggle(event: Event): void {
  const state = (event as Event & { newState?: string }).newState
  if (state !== "open") return

  requestAnimationFrame(() => positionPopover())
}
</script>

<template>
  <span ref="anchor" class="inline-flex">
    <MediumButton
      type="button"
      :title="summaryTitle"
      :popovertarget="popoverId"
      popovertargetaction="toggle"
    >
      <span>{{ summaryText }}</span>
    </MediumButton>
  </span>

  <div
    :id="popoverId"
    ref="popover"
    popover="auto"
    class="pointer-events-auto bg-transparent w-64"
    :style="{
      position: 'fixed',
      inset: 'auto',
      left: position.left,
      top: position.top,
    }"
    @toggle="handleToggle"
  >
    <Card>
      <template #tag>
        <span>{{ t("usageDetailsTitle") }}</span>
      </template>

      <div class="px-3 py-2 backdrop-blur-md">
        <dl class="flex flex-col gap-1">
          <div class="flex justify-between gap-3">
            <dt>{{ t("totalTokens") }}</dt>
            <dd>
              {{ formatTokens(totalTokens) }}
            </dd>
          </div>

          <div class="flex justify-between gap-3">
            <dt>{{ t("uncachedInput") }}</dt>
            <dd>
              {{ formatTokens(props.totalUsage.cacheMiss) }}
            </dd>
          </div>

          <div class="flex justify-between gap-3">
            <dt>{{ t("cachedInput") }}</dt>
            <dd>
              {{ formatTokens(props.totalUsage.cacheRead) }}
            </dd>
          </div>

          <div
            v-if="props.totalUsage.cacheWrite > 0"
            class="flex justify-between gap-3"
          >
            <dt>{{ t("cacheWrite") }}</dt>
            <dd>
              {{ formatTokens(props.totalUsage.cacheWrite) }}
            </dd>
          </div>

          <div class="flex justify-between gap-3">
            <dt>{{ t("outputTokens") }}</dt>
            <dd>
              {{ formatTokens(props.totalUsage.output) }}
            </dd>
          </div>

          <div class="flex justify-between gap-3">
            <dt>{{ t("cacheHitRate") }}</dt>
            <dd>{{ formatPercent(cacheHitRate) }}</dd>
          </div>
        </dl>
      </div>
    </Card>
  </div>
</template>
