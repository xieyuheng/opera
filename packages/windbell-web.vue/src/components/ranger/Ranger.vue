<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { useI18n } from "vue-i18n"

import { useMediaQuery } from "../../utils/dom/useMediaQuery.ts"
import { makeDividerState } from "../divider/DividerState.ts"
import ResizeDivider from "../divider/ResizeDivider.vue"
import { rangerMessages } from "./Ranger.i18n.ts"
import RangerSidebar from "./RangerSidebar.vue"
import {
  goParent,
  loadRanger,
  makeRangerState,
  moveSelection,
  openSelectedEntry,
  selectEntry,
  watchRanger,
} from "./RangerState.ts"
import RangerView from "./RangerView.vue"

const props = defineProps<{
  root: string
  locationStorageKey: string
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n({
  messages: rangerMessages,
  useScope: "local",
})

const state = makeRangerState(props.root, props.locationStorageKey)
const isMobile = useMediaQuery("(max-width: 639px)")
const mobileSidebarOpen = ref(true)
const sidebarDivider = makeDividerState({
  defaultRatio: 0.25,
  minRatio: 0.15,
  maxRatio: 0.5,
  storageKey: "windbell.ranger.sidebarRatio",
})
const sidebarStyle = computed(() =>
  isMobile.value ? undefined : { width: `${sidebarDivider.ratio * 100}%` },
)
const panel = ref<HTMLElement | null>(null)

let stopWatch: (() => void) | undefined

function focusPanel(): void {
  panel.value?.focus({ preventScroll: true })
}

function startWatching(): void {
  stopWatching()
  stopWatch = watchRanger(state, (error) => {
    state.error = error.message
  })
}

function stopWatching(): void {
  stopWatch?.()
  stopWatch = undefined
}

async function handleSelect(index: number): Promise<void> {
  const entry = state.entries[index]
  if (entry === undefined) return

  const wasSelected = index === state.selectedIndex

  state.focus = "sidebar"
  selectEntry(state, index)

  if (entry.kind === "Directory" && (isMobile.value || wasSelected)) {
    await openSelectedEntry(state)
  }
}

async function handleGoParent(): Promise<void> {
  if (state.currentDirectory === "") return

  state.focus = "sidebar"
  await goParent(state)
}

async function handleKeydown(event: KeyboardEvent): Promise<void> {
  switch (event.key) {
    case "ArrowUp": {
      if (state.focus !== "sidebar") return
      event.preventDefault()
      moveSelection(state, -1)
      return
    }

    case "ArrowDown": {
      if (state.focus !== "sidebar") return
      event.preventDefault()
      moveSelection(state, 1)
      return
    }

    case "ArrowLeft": {
      event.preventDefault()

      if (state.focus === "view") {
        state.focus = "sidebar"
        return
      }

      await goParent(state)
      return
    }

    case "ArrowRight": {
      if (state.focus === "view") return
      event.preventDefault()
      await openSelectedEntry(state)
      return
    }

    case "Escape": {
      if (state.focus !== "view") return
      event.preventDefault()
      state.focus = "sidebar"
    }
  }
}

function onKeydown(event: KeyboardEvent): void {
  if (event.defaultPrevented) return
  if (event.target !== event.currentTarget) return

  void handleKeydown(event)
}

onMounted(async () => {
  focusPanel()
  await loadRanger(state)
  startWatching()
})

watch(
  () => [props.root, props.locationStorageKey] as const,
  async ([root, locationStorageKey]) => {
    stopWatching()
    state.root = root
    state.locationStorageKey = locationStorageKey
    await loadRanger(state)
    startWatching()
  },
)

onBeforeUnmount(() => {
  stopWatching()
})
</script>

<template>
  <main
    ref="panel"
    class="flex h-dvh w-full flex-col overflow-hidden outline-none sm:flex-row"
    tabindex="0"
    @pointerdown="focusPanel"
    @keydown="onKeydown"
  >
    <RangerSidebar
      class="order-2 w-full shrink-0 sm:order-1 sm:w-auto"
      :class="isMobile ? (mobileSidebarOpen ? 'h-[45dvh]' : 'h-10') : 'h-full'"
      :style="sidebarStyle"
      :root="state.root"
      :current-directory="state.currentDirectory"
      :entries="state.entries"
      :selected-index="state.selectedIndex"
      :focus="state.focus"
      :mobile="isMobile"
      :expanded="mobileSidebarOpen"
      @select="handleSelect($event)"
      @go-parent="handleGoParent"
      @toggle="mobileSidebarOpen = !mobileSidebarOpen"
      @close="emit('close')"
    />

    <ResizeDivider class="order-2 hidden sm:flex" :state="sidebarDivider" />

    <section
      v-if="state.isLoading"
      class="order-1 flex min-h-0 min-w-0 flex-1 items-start px-3 py-3 sm:order-3"
    >
      <p class="text-ink">
        {{ t("loading") }}
      </p>
    </section>

    <section
      v-else-if="state.error !== undefined && !state.hasLoaded"
      class="order-1 flex min-h-0 min-w-0 flex-1 items-start px-3 py-3 sm:order-3"
    >
      <p class="text-sign-error">
        {{ state.error }}
      </p>
    </section>

    <section
      v-else
      class="order-1 flex min-h-0 min-w-0 flex-1 flex-col sm:order-3"
    >
      <p v-if="state.error !== undefined" class="text-sign-error px-3 py-3">
        {{ state.error }}
      </p>

      <RangerView
        class="min-w-0 flex-1"
        :class="{ 'opacity-60': state.isPending }"
        :entry="state.selectedEntry"
      />
    </section>
  </main>
</template>
