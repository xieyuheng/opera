<script setup lang="ts">
import { computed, reactive, ref } from "vue"
import { useI18n } from "vue-i18n"
import type * as S from "@windbell/semiosis.js/core"
import MediumButton from "../../components/buttons/MediumButton.vue"
import Card from "../../components/card/Card.vue"
import { sessionMessages } from "./Session.i18n.ts"

const props = defineProps<{
  turns: Array<S.TurnDetails>
  userSummaries: Array<string | undefined>
}>()

const emit = defineEmits<{
  selectTurn: [turnIndex: number]
}>()

const { t } = useI18n({
  messages: sessionMessages,
  useScope: "local",
})

const popoverId = `session-turns-${Math.random().toString(36).slice(2)}`
const anchor = ref<HTMLElement | null>(null)
const popover = ref<HTMLElement | null>(null)
const expanded = ref(new Set<number>())
const position = reactive({
  left: "0px",
  top: "0px",
})

const turnCount = computed(() => props.turns.length)

const stepCount = computed(() =>
  props.turns.reduce((total, turn) => total + turn.steps.length, 0),
)

const summaryText = computed(() =>
  t("turnSummary", {
    turns: turnCount.value,
    steps: stepCount.value,
  }),
)

function formatNumber(value: number): string {
  return value.toFixed(1).replace(/\.0$/, "")
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${formatNumber(tokens / 1_000_000)}M`
  if (tokens >= 1_000) return `${formatNumber(tokens / 1_000)}K`
  return String(tokens)
}

function toggleSteps(index: number): void {
  const next = new Set(expanded.value)
  if (next.has(index)) {
    next.delete(index)
  } else {
    next.add(index)
  }
  expanded.value = next
}

function selectTurn(index: number): void {
  emit("selectTurn", index + 1)
}

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
      :title="t('turnList')"
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
    class="pointer-events-auto bg-transparent w-80 max-w-[calc(100vw-2rem)]"
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
        <span>{{ t("turnList") }}</span>
      </template>

      <div class="px-3 py-2 backdrop-blur-md">
        <p v-if="props.turns.length === 0" class="text-ink">
          {{ t("turnEmpty") }}
        </p>

        <div v-else class="flex max-h-96 flex-col overflow-y-auto">
          <div
            v-for="(turn, index) in props.turns"
            :key="turn.id"
            class="border-b border-line last:border-b-0"
          >
            <div class="flex items-center gap-2 py-1">
              <button
                type="button"
                class="flex min-w-0 flex-1 items-baseline gap-2 text-left"
                @click="selectTurn(index)"
              >
                <span class="shrink-0"> {{ index + 1 }}. </span>
                <span class="truncate">
                  {{ props.userSummaries[index] ?? "" }}
                </span>
              </button>

              <button
                type="button"
                class="shrink-0"
                :title="t('stepCount', { count: turn.steps.length })"
                @click="toggleSteps(index)"
              >
                {{ t("stepCount", { count: turn.steps.length }) }}
              </button>
            </div>

            <div v-if="expanded.has(index)" class="pb-2">
              <div
                v-for="step in turn.steps"
                :key="step.sequenceNumber"
                class="pl-[1rem] text-sm flex justify-between"
              >
                # {{ step.sequenceNumber }}
                <span v-if="step.status !== 'completed'" class="ml-1">
                  {{ step.status }}
                </span>
                <span v-if="step.usage" class="ml-1">
                  {{ formatTokens(step.usage.total) }} {{ t("tokensUnit") }}
                </span>
                <span
                  v-if="step.error"
                  class="ml-1 text-sign-error"
                  :title="step.error.message"
                >
                  {{ step.error.message }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>
