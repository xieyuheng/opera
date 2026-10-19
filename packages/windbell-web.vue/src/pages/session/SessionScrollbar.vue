<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue"

const props = defineProps<{
  scrollTop: number
  clientHeight: number
  scrollHeight: number
}>()

const emit = defineEmits<{
  seek: [scrollTop: number]
}>()

const MIN_THUMB_HEIGHT = 24

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

const maxScrollTop = computed(() =>
  Math.max(props.scrollHeight - props.clientHeight, 0),
)

const progress = computed(() => {
  if (maxScrollTop.value <= 0) return 0
  return clamp(props.scrollTop / maxScrollTop.value, 0, 1)
})

const thumb = computed(() => {
  if (props.scrollHeight <= 0 || trackHeight.value <= 0) {
    return { top: 0, height: 0, travel: 0 }
  }

  const height = Math.min(
    Math.max(
      (props.clientHeight / props.scrollHeight) * trackHeight.value,
      MIN_THUMB_HEIGHT,
    ),
    trackHeight.value,
  )
  const travel = Math.max(trackHeight.value - height, 0)

  return {
    top: progress.value * travel,
    height,
    travel,
  }
})

function trackY(clientY: number): number {
  const element = track.value
  if (element === null) return 0

  const rect = element.getBoundingClientRect()
  return clamp(clientY - rect.top, 0, trackHeight.value)
}

function seek(scrollTop: number): void {
  emit("seek", clamp(scrollTop, 0, maxScrollTop.value))
}

function seekFromThumbTop(thumbTop: number): void {
  const travel = thumb.value.travel
  const nextProgress = travel > 0 ? clamp(thumbTop / travel, 0, 1) : 0
  seek(nextProgress * maxScrollTop.value)
}

function handlePointerDown(event: PointerEvent): void {
  event.preventDefault()
  const y = trackY(event.clientY)
  const currentThumb = thumb.value

  if (
    currentThumb.travel > 0 &&
    y >= currentThumb.top &&
    y <= currentThumb.top + currentThumb.height
  ) {
    dragMode = "thumb"
    dragOffset = y - currentThumb.top
  } else {
    dragMode = "track"
    seekFromThumbTop(y - currentThumb.height / 2)
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
  const currentThumb = thumb.value

  if (dragMode === "thumb") {
    seekFromThumbTop(clamp(y - dragOffset, 0, currentThumb.travel))
    return
  }

  seekFromThumbTop(y - currentThumb.height / 2)
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
    class="relative h-full w-2 shrink-0 cursor-pointer touch-none select-none"
    @pointerdown="handlePointerDown"
    @pointermove="handlePointerMove"
    @pointerup="handlePointerUp"
    @pointercancel="handlePointerUp"
  >
    <div
      class="bg-ink/80 pointer-events-none absolute inset-x-0"
      :style="{
        top: `${thumb.top}px`,
        height: `${thumb.height}px`,
      }"
    />
  </div>
</template>
