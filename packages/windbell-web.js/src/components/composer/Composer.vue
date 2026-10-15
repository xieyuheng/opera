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

let compactMetrics: CompactMetrics | null = null
let finishTimer: number | undefined

const showExpanded = computed(() => !props.collapsible || expanded.value)
const showCancelButton = computed(() => props.submitting && props.cancelable)
const hasNewline = computed(() => /[\r\n]/.test(input.value))
const canCollapse = computed(() => {
  if (input.value === "") return true
  if (hasNewline.value) return false
  return !compactOverflow.value
})
const minHeight = computed(() => `calc(${props.minRows} * 1.5rem + 1rem)`)

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

  if (!showExpanded.value) return
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
    shellHeight.value = undefined
    captureCompactHeight()

    writeSelection(compactTextarea.value, selection)
    await checkCompactOverflow()
  }
}

async function expand(options: { overflow?: boolean } = {}): Promise<void> {
  if (!props.collapsible || showExpanded.value || isAnimating.value) return

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

onMounted(() => {
  if (showExpanded.value) {
    void resizeExpandedTextarea()
    if (props.autofocus) {
      focusActiveTextarea()
    }

    return
  }

  captureCompactHeight()
  if (props.autofocus) {
    focusActiveTextarea()
  }
})

onBeforeUnmount(() => {
  if (finishTimer !== undefined) {
    window.clearTimeout(finishTimer)
  }
})

function handleShellTransitionEnd(event: TransitionEvent): void {
  if (event.target !== shellRef.value || event.propertyName !== "height") return
  void finishAnimation()
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
      class="pointer-events-auto flex w-full shrink-0 items-center gap-px rounded-lg border border-line/60 backdrop-blur-md transition-[border-color,box-shadow] duration-[160ms] ease-out hover:border-ink/30 focus-within:border-sign-user/60 focus-within:ring-[3px] focus-within:ring-sign-user/25"
      @submit.prevent="submit"
    >
      <textarea
        ref="compactTextarea"
        v-model="input"
        class="h-10 min-w-0 flex-1 resize-none overflow-hidden bg-transparent p-2 text-ink outline-none placeholder:text-ink/60 disabled:opacity-50"
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
      class="pointer-events-auto flex w-full shrink-0 flex-col gap-2 overflow-hidden rounded-lg border border-line/60 p-2 backdrop-blur-md transition-[border-color,box-shadow] duration-[160ms] ease-out hover:border-ink/30 focus-within:border-sign-user/60 focus-within:ring-[3px] focus-within:ring-sign-user/25"
      @submit.prevent="submit"
    >
      <textarea
        ref="expandedTextarea"
        v-model="input"
        class="thin-scrollbar w-full resize-none overflow-y-auto bg-transparent text-ink outline-none placeholder:text-ink/60 disabled:opacity-50"
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
