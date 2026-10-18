<script setup lang="ts">
import { computed, ref, watch } from "vue"
import {
  cssColorToOklch,
  formatOklch,
  oklchToCss,
  parseOklch,
  type Oklch,
} from "../../utils/color/oklch.ts"

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  "update:modelValue": [value: string]
}>()

const fallback: Oklch = { l: 0.5, c: 0, h: 0 }
const draft = ref<Oklch>(
  typeof props.modelValue === "string"
    ? (cssColorToOklch(props.modelValue) ?? fallback)
    : fallback,
)

const previewHex = computed(() => oklchToCss(draft.value))
const oklchText = computed(() => formatOklch(draft.value))

watch(
  () => props.modelValue,
  (value) => {
    if (typeof value === "string") {
      draft.value = cssColorToOklch(value) ?? draft.value
    }
  },
)

function emitDraft(): void {
  emit("update:modelValue", formatOklch(draft.value))
}

function updateFromText(value: string): void {
  const parsed = parseOklch(value)
  if (parsed === undefined) return

  draft.value = parsed
  emitDraft()
}

function updateFromHex(value: string): void {
  const parsed = cssColorToOklch(value)
  if (parsed === undefined) return

  draft.value = parsed
  emitDraft()
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex flex-row gap-2">
      <input
        :value="previewHex"
        class="h-25 w-25 shrink-0 cursor-pointer rounded border border-line bg-transparent"
        type="color"
        @input="updateFromHex(($event.target as HTMLInputElement).value)"
      />

      <div class="flex flex-col w-full gap-2">
        <label class="flex items-center gap-2 text-xs text-ink">
          <span class="w-3">L</span>
          <input
            v-model.number="draft.l"
            class="min-w-0 flex-1 accent-ink"
            type="range"
            min="0"
            max="1"
            step="0.01"
            @input="emitDraft"
          />
          <span class="w-10 text-right font-mono">
            {{ Math.round(draft.l * 100) }}%
          </span>
        </label>

        <label class="flex items-center gap-2 text-xs text-ink">
          <span class="w-3">C</span>
          <input
            v-model.number="draft.c"
            class="min-w-0 flex-1 accent-ink"
            type="range"
            min="0"
            max="0.4"
            step="0.001"
            @input="emitDraft"
          />
          <span class="w-10 text-right font-mono">
            {{ draft.c.toFixed(3) }}
          </span>
        </label>

        <label class="flex items-center gap-2 text-xs text-ink">
          <span class="w-3">H</span>
          <input
            v-model.number="draft.h"
            class="min-w-0 flex-1 accent-ink"
            type="range"
            min="0"
            max="360"
            step="1"
            @input="emitDraft"
          />
          <span class="w-10 text-right font-mono">
            {{ Math.round(draft.h) }}
          </span>
        </label>

        <input
          :value="oklchText"
          class="min-w-0 flex-1 rounded border border-line bg-paper px-2 py-1 font-mono text-xs text-ink outline-none focus:border-ink"
          type="text"
          spellcheck="false"
          @change="updateFromText(($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>
  </div>
</template>
