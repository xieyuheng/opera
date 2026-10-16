<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import SignCard from "../../components/sign/SignCard.vue"
import TurnErrorCard from "./TurnErrorCard.vue"
import { sessionMessages } from "./Session.i18n.ts"
import type { SessionState } from "./SessionState.ts"

const props = withDefaults(
  defineProps<{
    state: SessionState
    bottomPadding?: number
  }>(),
  {
    bottomPadding: 72,
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
const stickToBottom = ref(true)
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

function updateStickToBottom(): void {
  const element = scroller.value
  if (element === null) return

  stickToBottom.value =
    element.scrollHeight - element.scrollTop - element.clientHeight <=
    BOTTOM_THRESHOLD
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
}

function scheduleAutoScroll(): void {
  if (!stickToBottom.value) return

  void scrollToBottom()
}

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

watch(
  () => props.bottomPadding,
  () => {
    const element = scroller.value
    if (element === null || element.scrollHeight <= element.clientHeight) return

    scheduleAutoScroll()
  },
)

defineExpose({ scrollToBottom })
</script>

<template>
  <div
    ref="scroller"
    class="session-sign-list-scroller thin-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pt-16"
    :style="{ paddingBottom: `${props.bottomPadding}px` }"
    @scroll.passive="updateStickToBottom"
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
  </div>
</template>

<style scoped>
.session-sign-list-scroller {
  scrollbar-gutter: stable both-edges;
}
</style>
