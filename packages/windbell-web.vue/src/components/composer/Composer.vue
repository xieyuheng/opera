<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { useI18n } from "vue-i18n"

import MediumButton from "../buttons/MediumButton.vue"
import { composerMessages } from "./Composer.i18n.ts"
import {
  captureCompactMetrics,
  readSelection,
  resizeTextarea,
  wouldWrapInCompact,
  writeSelection,
  type CompactMetrics,
  type TextSelection,
} from "./composerText.ts"

type AnimationMode = "expanding" | "collapsing"

const ANIMATION_DURATION = 160
const VIEWPORT_RESIZE_MARGIN = 96

const props = withDefaults(
  defineProps<{
    modelValue: string
    collapsible?: boolean
    disabled?: boolean
    submitDisabled?: boolean
    submitting?: boolean
    cancelable?: boolean
    placeholder?: string
    submitLabel?: string
    submittingLabel?: string
    autofocus?: boolean
    collapseOnSubmit?: boolean
    resizable?: boolean
    minRows?: number
    maxHeight?: string
  }>(),
  {
    collapsible: true,
    disabled: false,
    submitDisabled: false,
    submitting: false,
    cancelable: false,
    placeholder: "",
    submitLabel: "Send",
    submittingLabel: "Sending...",
    autofocus: false,
    collapseOnSubmit: true,
    resizable: false,
    minRows: 5,
    maxHeight: "calc(100dvh - 6rem)",
  },
)

const emit = defineEmits<{
  "update:modelValue": [value: string]
  submit: []
  cancel: []
}>()

const { t } = useI18n({
  messages: composerMessages,
  useScope: "local",
})

const input = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
})

const shellRef = ref<HTMLElement | null>(null)
const compactForm = ref<HTMLElement | null>(null)
const expandedForm = ref<HTMLElement | null>(null)
const compactTextarea = ref<HTMLTextAreaElement | null>(null)
const expandedTextarea = ref<HTMLTextAreaElement | null>(null)

const expanded = ref(false)
const compactOverflow = ref(false)
const compactHeight = ref(0)
const shellHeight = ref<string | undefined>(undefined)
const isAnimating = ref(false)
const animationMode = ref<AnimationMode | null>(null)
const pendingSelection = ref<TextSelection | null>(null)
const manualHeight = ref<number | null>(null)

let compactMetrics: CompactMetrics | null = null
let finishTimer: number | undefined
let resizeStartY = 0
let resizeStartHeight = 0
let resizeMinHeight = 0
let resizeMaxHeight = 0
let isResizing = false

const showExpanded = computed(() => !props.collapsible || expanded.value)
const showCancelButton = computed(() => props.submitting && props.cancelable)
const hasNewline = computed(() => /[\r\n]/.test(input.value))
const canCollapse = computed(() => {
  if (input.value === "") return true
  if (hasNewline.value) return false
  return !compactOverflow.value
})
const minHeight = computed(() => `calc(${props.minRows} * 1.5rem + 1rem)`)
const expandedFormStyle = computed(() =>
  manualHeight.value === null
    ? undefined
    : { height: `${manualHeight.value}px` },
)

function forceReflow(): void {
  void shellRef.value?.offsetHeight
}

function captureCompactHeight(): void {
  const height = compactForm.value?.offsetHeight
  if (height !== undefined && height > 0) {
    compactHeight.value = height
  }
}

function scheduleAnimationFinish(): void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    void finishAnimation()
    return
  }

  if (finishTimer !== undefined) {
    window.clearTimeout(finishTimer)
  }

  finishTimer = window.setTimeout(() => {
    finishTimer = undefined
    void finishAnimation()
  }, ANIMATION_DURATION + 40)
}

function updateCompactOverflow(): void {
  compactOverflow.value =
    hasNewline.value || wouldWrapInCompact(input.value, compactMetrics)
}

async function resizeExpandedTextarea(): Promise<void> {
  await nextTick()

  if (!showExpanded.value || manualHeight.value !== null) return
  resizeTextarea(expandedTextarea.value)
}

async function finishAnimation(): Promise<void> {
  if (!isAnimating.value) return

  if (finishTimer !== undefined) {
    window.clearTimeout(finishTimer)
    finishTimer = undefined
  }

  const selection =
    pendingSelection.value ?? readSelection(null, input.value.length)
  pendingSelection.value = null

  if (animationMode.value === "expanding") {
    isAnimating.value = false
    animationMode.value = null
    manualHeight.value = null
    shellHeight.value = undefined
    writeSelection(expandedTextarea.value, selection)
    await resizeExpandedTextarea()
    return
  }

  if (animationMode.value === "collapsing") {
    expanded.value = false
    await nextTick()

    isAnimating.value = false
    animationMode.value = null
    manualHeight.value = null
    shellHeight.value = undefined
    captureCompactHeight()

    writeSelection(compactTextarea.value, selection)
    await checkCompactOverflow()
  }
}

async function expand(options: { overflow?: boolean } = {}): Promise<void> {
  if (!props.collapsible || showExpanded.value || isAnimating.value) return

  manualHeight.value = null
  pendingSelection.value = readSelection(
    compactTextarea.value,
    input.value.length,
  )
  compactMetrics = captureCompactMetrics(compactTextarea.value)
  compactOverflow.value =
    options.overflow === true ||
    hasNewline.value ||
    wouldWrapInCompact(input.value, compactMetrics)

  const startHeight = compactForm.value?.offsetHeight ?? compactHeight.value
  isAnimating.value = true
  animationMode.value = "expanding"
  shellHeight.value = `${startHeight}px`
  expanded.value = true

  await nextTick()

  resizeTextarea(expandedTextarea.value)
  const endHeight = expandedForm.value?.offsetHeight ?? startHeight
  forceReflow()
  shellHeight.value = `${endHeight}px`
  scheduleAnimationFinish()
}

async function checkCompactOverflow(): Promise<void> {
  await nextTick()

  const element = compactTextarea.value
  if (element === null || showExpanded.value) return

  const overflow = element.scrollHeight > element.clientHeight + 1
  compactOverflow.value = overflow || hasNewline.value
  if (compactOverflow.value) {
    await expand({ overflow: true })
  }
}

async function collapse(): Promise<void> {
  if (!props.collapsible || !expanded.value || !canCollapse.value) return
  if (isAnimating.value) return

  pendingSelection.value = readSelection(
    expandedTextarea.value,
    input.value.length,
  )
  compactOverflow.value = false

  const startHeight = expandedForm.value?.offsetHeight ?? 0
  const endHeight = compactHeight.value || 40
  isAnimating.value = true
  animationMode.value = "collapsing"
  shellHeight.value = `${startHeight}px`

  await nextTick()
  forceReflow()
  shellHeight.value = `${endHeight}px`
  scheduleAnimationFinish()
}

function updateState(): void {
  if (showExpanded.value) {
    if (props.collapsible) {
      updateCompactOverflow()
    }

    void resizeExpandedTextarea()
    return
  }

  void checkCompactOverflow()
}

watch(input, updateState, { flush: "post" })

function focusActiveTextarea(): void {
  const selection = {
    start: input.value.length,
    end: input.value.length,
  }

  if (showExpanded.value) {
    writeSelection(expandedTextarea.value, selection)
    return
  }

  writeSelection(compactTextarea.value, selection)
}

function shouldAutofocus(): boolean {
  if (!props.autofocus) return false

  // Avoid opening the virtual keyboard automatically on touch devices.
  return (
    typeof window.matchMedia !== "function" ||
    !window.matchMedia("(pointer: coarse)").matches
  )
}

onMounted(() => {
  const autofocus = shouldAutofocus()

  if (showExpanded.value) {
    void resizeExpandedTextarea()
    if (autofocus) {
      focusActiveTextarea()
    }

    return
  }

  captureCompactHeight()
  if (autofocus) {
    focusActiveTextarea()
  }
})

onBeforeUnmount(() => {
  finishResize()

  if (finishTimer !== undefined) {
    window.clearTimeout(finishTimer)
  }
})

function handleShellTransitionEnd(event: TransitionEvent): void {
  if (event.target !== shellRef.value || event.propertyName !== "height") return
  void finishAnimation()
}

function clampHeight(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function getResizeBounds(
  form: HTMLElement,
  textarea: HTMLTextAreaElement,
): { min: number; max: number } {
  const style = getComputedStyle(textarea)
  const minTextareaHeight = Number.parseFloat(style.minHeight)
  const maxTextareaHeight = Number.parseFloat(style.maxHeight)
  const chromeHeight = Math.max(0, form.offsetHeight - textarea.offsetHeight)
  const min =
    (Number.isFinite(minTextareaHeight) ? minTextareaHeight : 0) + chromeHeight
  const maxByTextarea =
    (Number.isFinite(maxTextareaHeight)
      ? maxTextareaHeight
      : Number.POSITIVE_INFINITY) + chromeHeight
  const maxByViewport = Math.max(0, window.innerHeight - VIEWPORT_RESIZE_MARGIN)

  return {
    min,
    max: Math.max(min, Math.min(maxByTextarea, maxByViewport)),
  }
}

function finishResize(): void {
  if (!isResizing) return

  isResizing = false
  window.removeEventListener("pointermove", handleResizeMove)
  window.removeEventListener("pointerup", finishResize)
  window.removeEventListener("pointercancel", finishResize)
}

function handleResizeMove(event: PointerEvent): void {
  if (!isResizing) return

  const delta = resizeStartY - event.clientY
  if (manualHeight.value === null) {
    if (Math.abs(delta) < 3) return

    manualHeight.value = resizeStartHeight
    if (expandedTextarea.value !== null) {
      expandedTextarea.value.style.height = ""
    }
  }

  event.preventDefault()
  const nextHeight = resizeStartHeight + delta
  manualHeight.value = clampHeight(nextHeight, resizeMinHeight, resizeMaxHeight)
}

function startResize(event: PointerEvent): void {
  if (!props.resizable || !showExpanded.value || isAnimating.value) return

  const form = expandedForm.value
  const textarea = expandedTextarea.value
  if (form === null || textarea === null) return

  const bounds = getResizeBounds(form, textarea)
  resizeStartY = event.clientY
  resizeStartHeight = form.offsetHeight
  resizeMinHeight = Math.min(bounds.min, resizeStartHeight)
  resizeMaxHeight = Math.max(bounds.max, resizeStartHeight)
  isResizing = true

  window.addEventListener("pointermove", handleResizeMove)
  window.addEventListener("pointerup", finishResize)
  window.addEventListener("pointercancel", finishResize)
}

function cancel(): void {
  if (!showCancelButton.value) return

  emit("cancel")
}

function submit(): void {
  if (props.disabled || props.submitDisabled || props.submitting) return

  const hadContent = input.value.trim() !== ""
  emit("submit")

  if (!props.collapsible || !props.collapseOnSubmit || !expanded.value) return

  void nextTick().then(() => {
    if (hadContent && input.value === "" && expanded.value) {
      void collapse()
    }
  })
}

function handleCompactKeydown(event: KeyboardEvent): void {
  if (event.key !== "Enter" || event.isComposing) return

  event.preventDefault()
  submit()
}

function handleToggle(): void {
  if (expanded.value) {
    void collapse()
  } else {
    void expand()
  }
}
</script>

<template>
  <div
    ref="shellRef"
    class="relative flex w-full flex-col justify-end transition-[height] duration-[160ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
    :class="{ 'overflow-hidden': isAnimating }"
    :style="shellHeight === undefined ? undefined : { height: shellHeight }"
    @transitionend="handleShellTransitionEnd"
  >
    <form
      v-if="!showExpanded"
      ref="compactForm"
      class="border-line hover:border-sign-user focus-within:border-sign-user focus-within:ring-sign-user pointer-events-auto flex w-full shrink-0 items-center gap-px rounded-lg border backdrop-blur-md transition-[border-color,box-shadow] duration-[160ms] ease-out focus-within:ring"
      @submit.prevent="submit"
    >
      <textarea
        ref="compactTextarea"
        v-model="input"
        class="text-ink placeholder:text-ink/60 min-w-0 flex-1 resize-none overflow-hidden bg-transparent px-2 outline-none disabled:opacity-50"
        :disabled="props.disabled"
        :placeholder="props.placeholder"
        rows="1"
        wrap="soft"
        @keydown="handleCompactKeydown"
      />

      <MediumButton
        variant="ghost"
        type="button"
        :aria-label="t('expandInput')"
        :title="t('expandInput')"
        @click="handleToggle"
      >
        <span>{{ t("expandInput") }}</span>
      </MediumButton>

      <MediumButton
        variant="accent"
        :type="showCancelButton ? 'button' : 'submit'"
        :disabled="
          props.disabled ||
          (showCancelButton ? false : props.submitDisabled || props.submitting)
        "
        :aria-label="
          showCancelButton
            ? t('cancel')
            : props.submitting
              ? props.submittingLabel
              : props.submitLabel
        "
        :title="
          showCancelButton
            ? t('cancel')
            : props.submitting
              ? props.submittingLabel
              : props.submitLabel
        "
        @click="showCancelButton ? cancel() : undefined"
      >
        <span>
          {{
            showCancelButton
              ? t("cancel")
              : props.submitting
                ? props.submittingLabel
                : props.submitLabel
          }}
        </span>
      </MediumButton>
    </form>

    <form
      v-else
      ref="expandedForm"
      class="border-line hover:border-sign-user focus-within:border-sign-user focus-within:ring-sign-user pointer-events-auto relative flex w-full shrink-0 flex-col gap-2 rounded-lg border-2 p-2 backdrop-blur-md transition-[border-color,box-shadow] duration-[160ms] ease-out focus-within:ring"
      :style="expandedFormStyle"
      @submit.prevent="submit"
    >
      <div
        v-if="props.resizable"
        class="group absolute inset-x-0 -top-2 z-10 flex h-4 cursor-ns-resize touch-none items-center justify-center select-none"
        role="separator"
        aria-orientation="horizontal"
        :aria-label="t('resizeInput')"
        :title="t('resizeInput')"
        @pointerdown.prevent="startResize"
      >
        <span
          class="bg-line group-hover:bg-ink/40 h-0.5 w-10 rounded-full transition-colors"
        />
      </div>

      <textarea
        ref="expandedTextarea"
        v-model="input"
        class="text-ink placeholder:text-ink/60 w-full resize-none overflow-y-auto bg-transparent outline-none disabled:opacity-50"
        :class="{ 'min-h-0 flex-1': manualHeight !== null }"
        :disabled="props.disabled"
        :placeholder="props.placeholder"
        :rows="props.minRows"
        :style="{
          minHeight,
          maxHeight: props.maxHeight,
        }"
      />

      <div class="flex shrink-0 items-center justify-end gap-2">
        <MediumButton
          v-if="props.collapsible"
          variant="ghost"
          type="button"
          :disabled="!canCollapse"
          :aria-label="t('collapseInput')"
          :title="t('collapseInput')"
          @click="handleToggle"
        >
          <span>{{ t("collapseInput") }}</span>
        </MediumButton>

        <MediumButton
          variant="accent"
          :type="showCancelButton ? 'button' : 'submit'"
          :disabled="
            props.disabled ||
            (showCancelButton
              ? false
              : props.submitDisabled || props.submitting)
          "
          :aria-label="
            showCancelButton
              ? t('cancel')
              : props.submitting
                ? props.submittingLabel
                : props.submitLabel
          "
          :title="
            showCancelButton
              ? t('cancel')
              : props.submitting
                ? props.submittingLabel
                : props.submitLabel
          "
          @click="showCancelButton ? cancel() : undefined"
        >
          <span>
            {{
              showCancelButton
                ? t("cancel")
                : props.submitting
                  ? props.submittingLabel
                  : props.submitLabel
            }}
          </span>
        </MediumButton>
      </div>
    </form>
  </div>
</template>
