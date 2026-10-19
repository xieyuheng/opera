<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue"

const props = defineProps<{
  code: string
  lang?: string | null
  meta?: string | null
}>()

const copied = ref(false)
let resetTimer: number | undefined

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
  <div
    class="border-ink/20 bg-ink/10 my-4 overflow-hidden rounded-md border"
  >
    <div
      class="border-ink/15 bg-ink/5 flex items-center justify-between gap-3 border-b py-1 pr-1 pl-3"
    >
      <div class="flex min-w-0 items-baseline gap-2">
        <span
          class="text-ink/60 shrink-0 font-mono font-semibold"
        >
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
        class="text-ink/60 hover:text-ink focus-visible:outline-ink/40 inline-flex py-0.5 shrink-0 items-center gap-0.5 rounded px-2 font-mono text-[11px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-1"
        :title="copied ? '已复制' : '复制代码'"
        :aria-label="copied ? '已复制' : '复制代码'"
        @click="copyCode"
      >
        <svg
          v-if="copied"
          aria-hidden="true"
          viewBox="0 0 16 16"
          class="size-3.5"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
        >
          <path d="m3.25 8.25 3 3 6.5-6.5" />
        </svg>
        <svg
          v-else
          aria-hidden="true"
          viewBox="0 0 16 16"
          class="size-3.5"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
        >
          <rect x="5.25" y="5.25" width="7.5" height="7.5" rx="1" />
          <path
            d="M10.75 5.25v-1a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h1"
          />
        </svg>
        <span aria-live="polite">{{ copied ? "已复制" : "复制" }}</span>
      </button>
    </div>

    <pre
      class="overflow-x-auto px-3 py-2 font-mono leading-relaxed"
    ><code>{{ code }}</code></pre>
  </div>
</template>
