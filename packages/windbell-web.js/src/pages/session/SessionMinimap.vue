<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { resolveSignViewColor } from "../../components/sign/views/registry.ts"
import type { SessionMinimapBlock } from "./sessionMinimap.ts"

const props = defineProps<{
  blocks: SessionMinimapBlock[]
  scrollTop: number
  clientHeight: number
  scrollHeight: number
  ratio: number
}>()

const emit = defineEmits<{
  seek: [scrollTop: number]
}>()

const track = ref<HTMLElement | null>(null)
const trackHeight = ref(0)

let trackResizeObserver: ResizeObserver | undefined
let dragMode: "thumb" | "track" | null = null
let dragOffset = 0

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function updateTrackHeight(): void {
  trackHeight.value = track.value?.clientHeight ?? 0
}

const minimapScale = computed(() => {
  if (!Number.isFinite(props.ratio) || props.ratio <= 0) return 0
  return 1 / props.ratio
})

const mainMaxScrollTop = computed(() =>
  Math.max(props.scrollHeight - props.clientHeight, 0),
)

const progress = computed(() => {
  if (mainMaxScrollTop.value <= 0) return 0
  return clamp(props.scrollTop / mainMaxScrollTop.value, 0, 1)
})

const minimapContentHeight = computed(
  () => props.scrollHeight * minimapScale.value,
)

const minimapMaxScrollTop = computed(() =>
  Math.max(minimapContentHeight.value - trackHeight.value, 0),
)

const slider = computed(() => {
  const scale = minimapScale.value
  if (scale <= 0 || trackHeight.value <= 0) {
    return { top: 0, height: 0, travel: 0 }
  }

  const height = Math.min(
    props.clientHeight * scale,
    minimapContentHeight.value,
  )
  const travel = Math.max(
    Math.min(trackHeight.value, minimapContentHeight.value) - height,
    0,
  )

  return {
    top: progress.value * travel,
    height,
    travel,
  }
})

const minimapScrollTop = computed(() => {
  if (minimapScale.value <= 0) return 0

  return clamp(
    props.scrollTop * minimapScale.value - slider.value.top,
    0,
    minimapMaxScrollTop.value,
  )
})

function blockStyle(block: SessionMinimapBlock): Record<string, string> {
  const scale = minimapScale.value
  return {
    top: `${block.top * scale}px`,
    height: `${block.height * scale}px`,
    backgroundColor: resolveSignViewColor(block.kind),
  }
}

function trackY(clientY: number): number {
  const element = track.value
  if (element === null) return 0

  const rect = element.getBoundingClientRect()
  return clamp(clientY - rect.top, 0, trackHeight.value)
}

function seek(scrollTop: number): void {
  emit("seek", clamp(scrollTop, 0, mainMaxScrollTop.value))
}

function seekFromSliderTop(sliderTop: number): void {
  const travel = slider.value.travel
  const nextProgress = travel > 0 ? clamp(sliderTop / travel, 0, 1) : 0
  seek(nextProgress * mainMaxScrollTop.value)
}

function handlePointerDown(event: PointerEvent): void {
  event.preventDefault()
  const y = trackY(event.clientY)
  const currentSlider = slider.value

  if (
    currentSlider.travel > 0 &&
    y >= currentSlider.top &&
    y <= currentSlider.top + currentSlider.height
  ) {
    dragMode = "thumb"
    dragOffset = y - currentSlider.top
  } else {
    dragMode = "track"
    seekFromSliderTop(y - currentSlider.height / 2)
  }

  try {
    track.value?.setPointerCapture(event.pointerId)
  } catch {
    // Synthetic pointer events may not have an active pointer.
  }
}

function handlePointerMove(event: PointerEvent): void {
  if (dragMode === null) return

  event.preventDefault()
  const y = trackY(event.clientY)
  const currentSlider = slider.value

  if (dragMode === "thumb") {
    seekFromSliderTop(clamp(y - dragOffset, 0, currentSlider.travel))
    return
  }

  seekFromSliderTop(y - currentSlider.height / 2)
}

function handlePointerUp(event: PointerEvent): void {
  dragMode = null

  const element = track.value
  if (element?.hasPointerCapture(event.pointerId)) {
    element.releasePointerCapture(event.pointerId)
  }
}

onMounted(() => {
  updateTrackHeight()

  if (track.value !== null) {
    trackResizeObserver = new ResizeObserver(updateTrackHeight)
    trackResizeObserver.observe(track.value)
  }
})

onBeforeUnmount(() => {
  trackResizeObserver?.disconnect()
})
</script>

<template>
  <div
    ref="track"
    class="relative h-full w-5 shrink-0 cursor-pointer touch-none select-none overflow-hidden"
    @pointerdown="handlePointerDown"
    @pointermove="handlePointerMove"
    @pointerup="handlePointerUp"
    @pointercancel="handlePointerUp"
  >
    <div
      class="pointer-events-none absolute inset-x-0 top-0"
      :style="{
        height: `${minimapContentHeight}px`,
        transform: `translateY(${-minimapScrollTop}px)`,
      }"
    >
      <div
        v-for="block in props.blocks"
        :key="block.index"
        class="absolute inset-x-0"
        :style="blockStyle(block)"
      />
    </div>

    <div
      class="pointer-events-none absolute inset-x-0 border border-ink bg-ink/30"
      :style="{
        top: `${slider.top}px`,
        height: `${slider.height}px`,
      }"
    />
  </div>
</template>
