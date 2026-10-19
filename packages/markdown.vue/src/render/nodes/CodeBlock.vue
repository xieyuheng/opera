<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, watch } from "vue"

import {
  HighlightedCodeView,
  highlightCode,
  type HighlightedCode,
} from "../../highlight/index.ts"

const props = defineProps<{
  code: string
  lang?: string | null
  meta?: string | null
}>()

const copied = ref(false)
const highlighted = shallowRef<HighlightedCode>()
let resetTimer: number | undefined

watch(
  [() => props.code, () => props.lang],
  async ([code, lang], _previous, onCleanup) => {
    let active = true
    onCleanup(() => {
      active = false
    })

    highlighted.value = undefined
    const tokens = await highlightCode(code, lang)

    if (active) {
      highlighted.value = tokens
    }
  },
  { immediate: true },
)

const language = computed(() => props.lang?.trim() || "text")
const extraInfo = computed(() => props.meta?.trim() ?? "")

async function writeToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fall back to a temporary textarea for browsers without Clipboard API.
  }

  const textarea = document.createElement("textarea")
  textarea.value = text
  textarea.setAttribute("readonly", "")
  textarea.style.position = "fixed"
  textarea.style.opacity = "0"
  document.body.append(textarea)
  textarea.select()

  try {
    return document.execCommand("copy")
  } catch {
    return false
  } finally {
    textarea.remove()
  }
}

async function copyCode(): Promise<void> {
  if (!(await writeToClipboard(props.code))) return

  copied.value = true
  window.clearTimeout(resetTimer)
  resetTimer = window.setTimeout(() => {
    copied.value = false
  }, 1600)
}

onBeforeUnmount(() => {
  window.clearTimeout(resetTimer)
})
</script>

<template>
  <div class="border-ink/80 my-4 overflow-hidden rounded-md border">
    <div
      class="border-ink/60 flex items-center justify-between gap-3 border-b py-1 pr-1 pl-3"
    >
      <div class="flex min-w-0 items-baseline gap-2">
        <span class="text-ink/80 shrink-0 font-mono font-semibold">
          {{ language }}
        </span>
        <span
          v-if="extraInfo"
          class="text-ink/60 min-w-0 truncate font-mono"
          :title="extraInfo"
        >
          {{ extraInfo }}
        </span>
      </div>

      <button
        type="button"
        class="text-ink/70 hover:text-ink focus-visible:outline-ink/40 inline-flex shrink-0 items-center gap-0.5 rounded px-2 py-0.5 font-mono text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-1"
        :title="copied ? '已复制' : '复制代码'"
        :aria-label="copied ? '已复制' : '复制代码'"
        @click="copyCode"
      >
        <span aria-live="polite">{{ copied ? "已复制" : "复制" }}</span>
      </button>
    </div>

    <pre
      class="overflow-x-auto px-3 py-2 font-mono leading-relaxed"
    ><HighlightedCodeView
        v-if="highlighted"
        :tokens="highlighted"
      /><code v-else>{{ code }}</code></pre>
  </div>
</template>
