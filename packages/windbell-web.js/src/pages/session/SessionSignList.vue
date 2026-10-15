<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import SignCard from "../../components/sign/SignCard.vue"
import TurnErrorCard from "./TurnErrorCard.vue"
import { sessionMessages } from "./Session.i18n.ts"
import type { SessionState } from "./SessionState.ts"

const props = defineProps<{
  state: SessionState
}>()

const emit = defineEmits<{
  retry: []
  edit: []
  dismiss: []
}>()

const { t } = useI18n({
  messages: sessionMessages,
  useScope: "local",
})

const scroller = ref<HTMLElement | null>(null)
const bottomAnchor = ref<HTMLElement | null>(null)
const bottomAnchorVisible = ref(true)
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

let bottomObserver: IntersectionObserver | undefined

async function scrollToBottom(): Promise<void> {
  await nextTick()

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve())
  })

  const element = scroller.value
  if (element === null) return

  element.scrollTop = element.scrollHeight
}

function scheduleAutoScroll(): void {
  if (!bottomAnchorVisible.value) return

  void scrollToBottom()
}

onMounted(() => {
  if (bottomAnchor.value !== null) {
    bottomObserver = new IntersectionObserver((entries) => {
      const entry = entries[0]
      if (entry !== undefined) {
        bottomAnchorVisible.value = entry.isIntersecting
      }
    })
    bottomObserver.observe(bottomAnchor.value)
  }
})

onBeforeUnmount(() => {
  bottomObserver?.disconnect()
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
  },
)

defineExpose({ scrollToBottom })
</script>

<template>
  <div
    ref="scroller"
    class="thin-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pt-16 pb-18"
  >
    <div class="mx-auto flex w-full max-w-4xl flex-col gap-4">
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

    <div ref="bottomAnchor" class="h-px w-full" />
  </div>
</template>
