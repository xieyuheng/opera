<script setup lang="ts">
import { makeSignPreview } from "@xieyuheng/windbell.ts/core"
import type * as W from "@xieyuheng/windbell.ts/core"
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { useI18n } from "vue-i18n"

import SignCard from "../../components/sign/SignCard.vue"
import SignLine from "../../components/sign/SignLine.vue"
import { sessionMessages } from "./Session.i18n.ts"
import type {
  SessionMinimapBlock,
  SessionSignListMetrics,
} from "./sessionMinimap.ts"
import type { SignDisplayMode } from "./sessionSignDisplayMode.ts"
import type { SessionState } from "./SessionState.ts"
import TurnErrorCard from "./TurnErrorCard.vue"

const props = withDefaults(
  defineProps<{
    state: SessionState
    bottomPadding: number
    signDisplayMode?: SignDisplayMode
  }>(),
  {
    signDisplayMode: "expand",
  },
)

const emit = defineEmits<{
  retry: []
  edit: []
  dismiss: []
  metrics: [metrics: SessionSignListMetrics]
}>()

const { t } = useI18n({
  messages: sessionMessages,
  useScope: "local",
})

const BOTTOM_THRESHOLD = 5

const scroller = ref<HTMLElement | null>(null)
const content = ref<HTMLElement | null>(null)
const stickToBottom = ref(true)
const minimapBlocks = ref<SessionMinimapBlock[]>([])
const signOverrides = ref(new Map<number, "expanded" | "collapsed">())
const scrollTop = ref(0)
const clientHeight = ref(0)
const scrollHeight = ref(0)

let contentResizeObserver: ResizeObserver | undefined
let scrollerResizeObserver: ResizeObserver | undefined
let minimapMeasureFrame: number | undefined

const title = computed(() =>
  props.state.hasLoaded ? props.state.title || t("notFound") : "",
)
const signs = computed(() => {
  const activeTurn = props.state.activeTurn
  if (activeTurn === undefined) return props.state.context

  const activeSigns = [...activeTurn.signs]

  if (!activeSigns.some((sign) => sign.kind === "UserSign")) {
    activeSigns.unshift({
      kind: "UserSign",
      content: activeTurn.input,
    })
  }

  if (activeTurn.partialSign !== undefined) {
    activeSigns.push(activeTurn.partialSign)
  }

  return [...props.state.context, ...activeSigns]
})

function defaultSignExpanded(sign: W.Sign): boolean {
  if (props.signDisplayMode === "overview") return false

  if (props.signDisplayMode === "digest") {
    return sign.kind === "UserSign" || sign.kind === "AssistantSign"
  }

  return true
}

function isSignExpanded(sign: W.Sign, index: number): boolean {
  const override = signOverrides.value.get(index)
  if (override === "expanded") return true
  if (override === "collapsed") return false

  return defaultSignExpanded(sign)
}

function isStreamingSign(sign: W.Sign): boolean {
  return props.state.activeTurn?.partialSign === sign
}

function toggleSign(index: number, sign: W.Sign): void {
  const next = new Map(signOverrides.value)
  next.set(index, isSignExpanded(sign, index) ? "collapsed" : "expanded")
  signOverrides.value = next
  scheduleMinimapMeasure()
}

function emitMetrics(): void {
  emit("metrics", {
    blocks: minimapBlocks.value,
    scrollTop: scrollTop.value,
    clientHeight: clientHeight.value,
    scrollHeight: scrollHeight.value,
  })
}

function updateScrollMetrics(): void {
  const element = scroller.value
  if (element === null) return

  scrollTop.value = element.scrollTop
  clientHeight.value = element.clientHeight
  scrollHeight.value = element.scrollHeight
}

function measureMinimapBlocks(): void {
  const scrollerElement = scroller.value
  const contentElement = content.value
  if (scrollerElement === null || contentElement === null) return

  const scrollerRect = scrollerElement.getBoundingClientRect()
  const signElements =
    contentElement.querySelectorAll<HTMLElement>("[data-sign-index]")
  const blocks: SessionMinimapBlock[] = []
  let turnIndex = 0

  for (const signElement of signElements) {
    const index = Number(signElement.dataset.signIndex)
    const sign = signs.value[index]
    if (sign === undefined) continue

    if (sign.kind === "UserSign") {
      turnIndex += 1
    }

    const rect = signElement.getBoundingClientRect()
    blocks.push({
      index,
      kind: sign.kind,
      top: rect.top - scrollerRect.top + scrollerElement.scrollTop,
      height: rect.height,
      turnIndex: sign.kind === "UserSign" ? turnIndex : undefined,
    })
  }

  minimapBlocks.value = blocks
  updateScrollMetrics()
  emitMetrics()
}

function scheduleMinimapMeasure(): void {
  if (minimapMeasureFrame !== undefined) return

  minimapMeasureFrame = window.requestAnimationFrame(() => {
    minimapMeasureFrame = undefined
    measureMinimapBlocks()
  })
}

function updateStickToBottom(): void {
  const element = scroller.value
  if (element === null) return

  stickToBottom.value =
    element.scrollHeight - element.scrollTop - element.clientHeight <=
    BOTTOM_THRESHOLD
}

function handleScroll(): void {
  updateStickToBottom()
  updateScrollMetrics()
  emitMetrics()
}

async function scrollToBottom(): Promise<void> {
  await nextTick()

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve())
  })

  const element = scroller.value
  if (element === null) return

  stickToBottom.value = true
  element.scrollTop = element.scrollHeight
  updateScrollMetrics()
  emitMetrics()
}

function scrollTo(value: number): void {
  const element = scroller.value
  if (element === null) return

  element.scrollTop = value
  updateScrollMetrics()
  emitMetrics()
}

function scrollToTurn(turnIndex: number): void {
  const block = minimapBlocks.value.find(
    (block) => block.turnIndex === turnIndex,
  )
  if (block === undefined) return

  scrollTo(block.top)
}

function scheduleAutoScroll(): void {
  if (!stickToBottom.value) return

  void scrollToBottom()
}

onMounted(() => {
  updateScrollMetrics()
  emitMetrics()
  void nextTick(scheduleMinimapMeasure)

  if (scroller.value !== null) {
    scrollerResizeObserver = new ResizeObserver(() => {
      updateScrollMetrics()
      emitMetrics()
      scheduleMinimapMeasure()
    })
    scrollerResizeObserver.observe(scroller.value)
  }

  if (content.value !== null) {
    contentResizeObserver = new ResizeObserver(() => {
      updateScrollMetrics()
      emitMetrics()
      scheduleMinimapMeasure()
    })
    contentResizeObserver.observe(content.value)
  }
})

onBeforeUnmount(() => {
  contentResizeObserver?.disconnect()
  scrollerResizeObserver?.disconnect()

  if (minimapMeasureFrame !== undefined) {
    window.cancelAnimationFrame(minimapMeasureFrame)
  }
})

watch(
  [
    () => signs.value.length,
    () => {
      const sign = props.state.activeTurn?.partialSign
      if (sign === undefined) return "none"
      if (sign.kind === "ReasoningSign" || sign.kind === "AssistantSign") {
        return `${sign.kind}:${sign.content.length}`
      }
      return sign.kind
    },
    () => props.state.error,
  ],
  () => {
    scheduleAutoScroll()
    scheduleMinimapMeasure()
  },
)

watch(
  () => props.signDisplayMode,
  () => {
    signOverrides.value.clear()
    updateScrollMetrics()
    scheduleMinimapMeasure()
  },
)

watch(
  () => props.bottomPadding,
  () => {
    updateScrollMetrics()
    emitMetrics()
    scheduleMinimapMeasure()

    const element = scroller.value
    if (element === null || element.scrollHeight <= element.clientHeight) return

    scheduleAutoScroll()
  },
)

defineExpose({ scrollTo, scrollToBottom, scrollToTurn })
</script>

<template>
  <div
    ref="scroller"
    class="min-h-0 flex-1 scrollbar-none overflow-y-auto px-1.5 pt-12 sm:px-4 [&::-webkit-scrollbar]:hidden"
    :style="{ paddingBottom: `${props.bottomPadding}px` }"
    @scroll.passive="handleScroll"
  >
    <div ref="content" class="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <h1 class="text-ink text-xl font-semibold">
        {{ title }}
      </h1>

      <p v-if="props.state.isLoading" class="text-ink">
        {{ t("loading") }}
      </p>

      <div
        v-else
        class="flex flex-col"
        :class="{ 'opacity-60': props.state.isPending }"
        :aria-busy="props.state.isPending"
      >
        <template v-for="(sign, index) in signs" :key="index">
          <SignCard
            v-if="isSignExpanded(sign, index)"
            class="py-1.5"
            :data-sign-index="index"
            :sign="sign"
            :workspace-root="props.state.workspaceRoot"
            :streaming="isStreamingSign(sign)"
            @tag-click="toggleSign(index, sign)"
          />

          <SignLine
            v-else
            class="py-0.5"
            :data-sign-index="index"
            :sign-preview="makeSignPreview(sign)"
            @tag-click="toggleSign(index, sign)"
            @line-click="toggleSign(index, sign)"
          />
        </template>
      </div>

      <TurnErrorCard
        v-if="!props.state.isLoading && props.state.error !== undefined"
        :message="props.state.error"
        :retryable="props.state.errorRetryable"
        :input-persisted="props.state.errorInputPersisted"
        @retry="emit('retry')"
        @edit="emit('edit')"
        @dismiss="emit('dismiss')"
      />
    </div>
  </div>
</template>
