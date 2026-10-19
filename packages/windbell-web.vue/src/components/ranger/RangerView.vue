<script setup lang="ts">
import type { FileSystemEntry } from "@windbell/fs.ts/fs"
import { unwrap } from "@windbell/std.ts/result"
import type { Component } from "vue"
import { ref, shallowRef, watch } from "vue"
import { useI18n } from "vue-i18n"

import { windbellFs as fs } from "../../app/fs.ts"
import { rangerMessages } from "./Ranger.i18n.ts"
import type { RangerContent } from "./RangerContent.ts"
import DirectoryView from "./views/DirectoryView.vue"
import { resolveFileView } from "./views/registry.ts"
import UnknownView from "./views/UnknownView.vue"

type DisplayedRangerView = {
  component: Component
  content: RangerContent
}

const props = defineProps<{
  entry: FileSystemEntry | undefined
}>()

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
    class="bg-paper relative flex h-full min-h-0 flex-col overflow-hidden"
  >
    <p v-if="error !== undefined" class="text-sign-error px-4 py-3">
      {{ error }}
    </p>

    <component
      v-else-if="displayed !== undefined"
      :is="displayed.component"
      :content="displayed.content"
    />

    <div
      v-else-if="pending"
      class="border-line border-t-ink pointer-events-none absolute top-3 right-3 z-10 h-4 w-4 animate-spin rounded-full border-2"
    />

    <div v-else class="text-ink flex flex-1 items-center justify-center px-4">
      {{ t("empty") }}
    </div>
  </section>
</template>
