<script setup lang="ts">
import { makeHttpFileSystemClient } from "@windbell/fs-api.js/client"
import type { FileSystemEntry } from "@windbell/fs.js/fs"
import { unwrap } from "@windbell/std.js/result"
import type { Component } from "vue"
import { ref, shallowRef, watch } from "vue"
import { useI18n } from "vue-i18n"
import DirectoryView from "./views/DirectoryView.vue"
import UnknownView from "./views/UnknownView.vue"
import { rangerMessages } from "./Ranger.i18n.ts"
import { resolveFileView } from "./views/registry.ts"
import type { RangerContent } from "./RangerContent.ts"

type DisplayedRangerView = {
  component: Component
  content: RangerContent
}

const props = defineProps<{
  entry: FileSystemEntry | undefined
}>()

const fs = makeHttpFileSystemClient({
  baseUrl: "/api/fs",
})

const { t } = useI18n({
  messages: rangerMessages,
  useScope: "local",
})

const displayed = shallowRef<DisplayedRangerView | undefined>(undefined)
const pending = ref(false)
const error = ref<string | undefined>(undefined)

let requestId = 0

async function loadEntryView(
  entry: FileSystemEntry,
): Promise<DisplayedRangerView> {
  if (entry.kind === "Directory") {
    const entries = unwrap(await fs.listEntries(entry.path))

    return {
      component: DirectoryView,
      content: { type: "directory", entries },
    }
  }

  const view = await resolveFileView(entry)
  if (view === undefined) {
    return {
      component: UnknownView,
      content: { type: "none" },
    }
  }

  const bytes = unwrap(await fs.readBytes(entry.path))

  return {
    component: view,
    content: { type: "file", bytes },
  }
}

watch(
  () => props.entry,
  async (entry) => {
    const currentRequestId = ++requestId

    error.value = undefined
    pending.value = false

    if (entry === undefined) {
      displayed.value = undefined
      return
    }

    pending.value = true

    try {
      const next = await loadEntryView(entry)
      if (currentRequestId !== requestId) return

      displayed.value = next
    } catch (caught) {
      if (currentRequestId !== requestId) return

      displayed.value = undefined
      error.value = caught instanceof Error ? caught.message : String(caught)
    } finally {
      if (currentRequestId === requestId) {
        pending.value = false
      }
    }
  },
  { immediate: true },
)
</script>

<template>
  <section
    class="relative flex h-full min-h-0 flex-col overflow-hidden bg-paper"
  >
    <p v-if="error !== undefined" class="px-4 py-3 text-sign-error">
      {{ error }}
    </p>

    <component
      v-else-if="displayed !== undefined"
      :is="displayed.component"
      :content="displayed.content"
    />

    <div
      v-else-if="pending"
      class="pointer-events-none absolute right-3 top-3 z-10 h-4 w-4 animate-spin rounded-full border-2 border-line border-t-ink"
    />

    <div v-else class="flex flex-1 items-center justify-center px-4 text-ink">
      {{ t("empty") }}
    </div>
  </section>
</template>
