<script setup lang="ts">
import { useHead } from "@unhead/vue"
import { computed, onMounted, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { useRoute, useRouter } from "vue-router"
import { makeDividerState } from "../../components/divider/DividerState.ts"
import ResizeDivider from "../../components/divider/ResizeDivider.vue"
import Composer from "../../components/composer/Composer.vue"
import SessionSignList from "./SessionSignList.vue"
import SessionToolbar from "./SessionToolbar.vue"
import Ranger from "../../components/ranger/Ranger.vue"
import { sessionMessages } from "./Session.i18n.ts"
import {
  cancelSessionInterpretation,
  dismissSessionError,
  editSessionInterpretation,
  generateSessionTitle,
  getSessionState,
  interpretSession,
  retrySessionInterpretation,
} from "./SessionState.ts"
import { receiveSessionMessages, type SessionMessage } from "./SessionInbox.ts"

function sessionRangerOpenStorageKey(sessionId: string): string {
  return `windbell.session.${sessionId}.rangerOpen`
}

function sessionWidthRatioStorageKey(sessionId: string): string {
  return `windbell.session.${sessionId}.sessionWidthRatio`
}

function sessionRangerLocationStorageKey(sessionId: string): string {
  return `windbell.session.${sessionId}.rangerLocation`
}

function readStoredRangerOpen(sessionId: string): boolean {
  try {
    return (
      localStorage.getItem(sessionRangerOpenStorageKey(sessionId)) === "true"
    )
  } catch {
    return false
  }
}

function writeStoredRangerOpen(sessionId: string, value: boolean): void {
  try {
    localStorage.setItem(sessionRangerOpenStorageKey(sessionId), String(value))
  } catch {
    // ignore storage errors
  }
}

const route = useRoute()
const router = useRouter()
const sessionId = computed(() => String(route.params.sessionId ?? ""))
const input = ref("")

const { t } = useI18n({
  messages: sessionMessages,
  useScope: "local",
})

const sessionDividerOptions = {
  defaultRatio: 0.5,
  minRatio: 0.25,
  maxRatio: 0.6,
}

const state = getSessionState(sessionId.value)
const rangerOpen = ref(readStoredRangerOpen(sessionId.value))
const sessionDivider = ref(
  makeDividerState({
    ...sessionDividerOptions,
    storageKey: sessionWidthRatioStorageKey(sessionId.value),
  }),
)
const locationStorageKey = computed(() =>
  sessionRangerLocationStorageKey(sessionId.value),
)
const signList = ref<InstanceType<typeof SessionSignList> | null>(null)
const title = computed(() =>
  state.hasLoaded ? state.title || t("notFound") : t("loading"),
)
const rangerPaneVisible = computed(
  () => rangerOpen.value && state.workspaceRoot !== "" && !state.isLoading,
)
const sessionPaneWidth = computed(() =>
  rangerPaneVisible.value ? `${sessionDivider.value.ratio * 100}%` : "100%",
)

function goBack(): void {
  if (state.workspaceId === "") {
    void router.push({ name: "home" })
    return
  }

  void router.push({
    name: "workspace",
    params: {
      workspaceId: state.workspaceId,
    },
  })
}

function cancel(): void {
  cancelSessionInterpretation(state)
}

function retry(): void {
  void retrySessionInterpretation(state)
}

function edit(): void {
  const value = editSessionInterpretation(state)

  if (value !== undefined) {
    input.value = value
  }
}

function dismiss(): void {
  dismissSessionError(state)
}

async function send(): Promise<void> {
  if (state.isLoading || state.isPending) return

  const content = input.value.trim()
  if (content === "" || state.interpreting) return

  input.value = ""
  await signList.value?.scrollToBottom()
  await interpretSession(state, content)
}

async function handleSessionMessage(message: SessionMessage): Promise<void> {
  switch (message.kind) {
    case "PendingInterpret": {
      const ok = await interpretSession(state, message.content)

      if (ok && message.generateTitle) {
        await generateSessionTitle(state)
      }

      return
    }
  }
}

async function receiveInbox(value: string): Promise<void> {
  const messages = receiveSessionMessages(value)

  for (const message of messages) {
    await handleSessionMessage(message)
  }
}

async function loadSession(value: string): Promise<void> {
  if (state.error !== undefined) return

  await receiveInbox(value)
  await signList.value?.scrollToBottom()
}

onMounted(async () => {
  await loadSession(sessionId.value)
})

watch(rangerOpen, (value) => {
  writeStoredRangerOpen(sessionId.value, value)
})

useHead(() => ({
  title: title.value,
  meta: [
    {
      name: "description",
      content: t("description"),
    },
  ],
}))
</script>

<template>
  <main class="flex h-screen w-full overflow-hidden">
    <section
      class="relative flex min-h-0 min-w-0 shrink-0 flex-col overflow-hidden"
      :style="{ width: sessionPaneWidth }"
    >
      <div class="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        <div
          class="pointer-events-none absolute inset-x-0 z-50"
          :style="{ top: 'calc(env(safe-area-inset-top, 0px) + 0.5rem)' }"
        >
          <SessionToolbar
            :state="state"
            :ranger-open="rangerOpen"
            @back="goBack"
            @toggle-ranger="rangerOpen = !rangerOpen"
          />
        </div>

        <SessionSignList
          ref="signList"
          :state="state"
          @retry="retry"
          @edit="edit"
          @dismiss="dismiss"
        />

        <div
          class="pointer-events-none absolute inset-x-0 bottom-[env(safe-area-inset-bottom,0px)] z-10 px-2 py-4"
        >
          <div class="mx-auto w-full max-w-4xl">
            <Composer
              v-model="input"
              autofocus
              :submitting="state.interpreting"
              cancelable
              :placeholder="t('inputPlaceholder')"
              :submit-label="t('send')"
              :submitting-label="t('sending')"
              :collapse-on-submit="true"
              @submit="send"
              @cancel="cancel"
            />
          </div>
        </div>
      </div>
    </section>

    <ResizeDivider v-if="rangerPaneVisible" :state="sessionDivider" />

    <div
      v-if="rangerPaneVisible"
      class="h-screen min-w-0 flex-1 overflow-hidden"
    >
      <Ranger
        :root="state.workspaceRoot"
        :location-storage-key="locationStorageKey"
      />
    </div>
  </main>
</template>
