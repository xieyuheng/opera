<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import SignCard from "../../components/sign/SignCard.vue"
import SessionMinimap from "./SessionMinimap.vue"
import TurnErrorCard from "./TurnErrorCard.vue"
import { sessionMessages } from "./Session.i18n.ts"
import type { SessionState } from "./SessionState.ts"
import type { SessionMinimapBlock } from "./sessionMinimap.ts"

const props = withDefaults(
  defineProps<{
    state: SessionState
    bottomPadding?: number
    minimapRatio?: number
  }>(),
  {
    bottomPadding: 72,
    minimapRatio: 10,
  },
)

const emit = defineEmits<{
  retry: []
  edit: []
  dismiss: []
}>()

const { t } = useI18n({
  messages: sessionMessages,
  useScope: "local",
})

const BOTTOM_THRESHOLD = 32

const scroller = ref<HTMLElement | null>(null)
const content = ref<HTMLElement | null>(null)
const stickToBottom = ref(true)
const minimapBlocks = ref<SessionMinimapBlock[]>([])
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

  for (const signElement of signElements) {
    const index = Number(signElement.dataset.signIndex)
    const sign = signs.value[index]
    if (sign === undefined) continue

    const rect = signElement.getBoundingClientRect()
    blocks.push({
      index,
      kind: sign.kind,
      top: rect.top - scrollerRect.top + scrollerElement.scrollTop,
      height: rect.height,
    })
  }

  minimapBlocks.value = blocks
  updateScrollMetrics()
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
}

function handleMinimapSeek(value: number): void {
  const element = scroller.value
  if (element === null) return

  element.scrollTop = value
  updateScrollMetrics()
}

function scheduleAutoScroll(): void {
  if (!stickToBottom.value) return

  void scrollToBottom()
}

onMounted(() => {
  updateScrollMetrics()
  void nextTick(scheduleMinimapMeasure)

  if (scroller.value !== null) {
    scrollerResizeObserver = new ResizeObserver(() => {
      updateScrollMetrics()
      scheduleMinimapMeasure()
    })
    scrollerResizeObserver.observe(scroller.value)
  }

  if (content.value !== null) {
    contentResizeObserver = new ResizeObserver(() => {
      updateScrollMetrics()
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
  () => props.bottomPadding,
  () => {
    updateScrollMetrics()
    scheduleMinimapMeasure()

    const element = scroller.value
    if (element === null || element.scrollHeight <= element.clientHeight) return

    scheduleAutoScroll()
  },
)

defineExpose({ scrollToBottom })
</script>

<template>
  <div class="relative min-h-0 flex-1 overflow-hidden">
    <div
      ref="scroller"
      class="session-sign-list-scroller thin-scrollbar h-full w-full overflow-y-auto px-4 pt-16"
      :style="{ paddingBottom: `${props.bottomPadding}px` }"
      @scroll.passive="handleScroll"
    >
      <div ref="content" class="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <h1 class="text-xl text-ink">
          {{ title }}
        </h1>

        <p v-if="props.state.isLoading" class="text-ink">
          {{ t("loading") }}
        </p>

        <ol
          v-else
          class="flex flex-col gap-4"
          :class="{ 'opacity-60': props.state.isPending }"
          :aria-busy="props.state.isPending"
        >
          <SignCard
            v-for="(sign, index) in signs"
            :key="index"
            :data-sign-index="index"
            :sign="sign"
            :workspace-root="props.state.workspaceRoot"
          />
        </ol>

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

    <SessionMinimap
      v-if="signs.length > 0"
      class="absolute inset-y-1 right-2.5 z-10"
      :blocks="minimapBlocks"
      :scroll-top="scrollTop"
      :client-height="clientHeight"
      :scroll-height="scrollHeight"
      :ratio="props.minimapRatio"
      @seek="handleMinimapSeek"
    />
  </div>
</template>

<style scoped>
.session-sign-list-scroller {
  scrollbar-gutter: stable both-edges;
}
</style>
