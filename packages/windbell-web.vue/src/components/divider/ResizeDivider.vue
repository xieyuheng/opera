<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue"
import {
  commitDividerRatio,
  setDividerRatio,
  type DividerState,
} from "./DividerState.ts"

const props = defineProps<{
  state: DividerState
}>()

const dragging = ref(false)
let container: HTMLElement | null = null

function updateRatio(event: PointerEvent): void {
  if (container === null) return

  const rect = container.getBoundingClientRect()
  if (rect.width === 0) return

  setDividerRatio(props.state, (event.clientX - rect.left) / rect.width)
}

function onPointerDown(event: PointerEvent): void {
  const target = event.currentTarget as HTMLElement | null

  container = target?.parentElement ?? null
  if (target === null || container === null) return

  event.preventDefault()
  dragging.value = true
  target.setPointerCapture(event.pointerId)
  document.body.style.userSelect = "none"
  document.body.style.cursor = "col-resize"

  updateRatio(event)
}

function onPointerMove(event: PointerEvent): void {
  if (!dragging.value) return

  updateRatio(event)
}

function onPointerUp(event: PointerEvent): void {
  if (!dragging.value) return

  const target = event.currentTarget as HTMLElement | null

  dragging.value = false
  container = null

  if (target !== null && target.hasPointerCapture(event.pointerId)) {
    target.releasePointerCapture(event.pointerId)
  }

  document.body.style.userSelect = ""
  document.body.style.cursor = ""
  commitDividerRatio(props.state)
}

onBeforeUnmount(() => {
  document.body.style.userSelect = ""
  document.body.style.cursor = ""
})
</script>

<template>
  <div
    class="group flex h-full w-1 shrink-0 cursor-col-resize touch-none justify-center"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <div
      class="h-full w-px"
      :class="dragging ? 'bg-ink/50' : 'bg-line group-hover:bg-ink/30'"
    />
  </div>
</template>
