<script setup lang="ts">
import type { FileSystemEntry } from "@windbell/fs.ts/fs"
import { unwrap } from "@windbell/std.ts/result"
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"

import { windbellFs as fs } from "../../app/fs.ts"
import MediumButton from "../../components/buttons/MediumButton.vue"
import Card from "../../components/card/Card.vue"
import { homeMessages } from "./Home.i18n.ts"

const props = defineProps<{
  popoverId: string
  creating: boolean
  error?: string
}>()

const emit = defineEmits<{
  create: [options: { name: string; root: string }]
}>()

const { t } = useI18n({
  messages: homeMessages,
  useScope: "local",
})

const popover = ref<HTMLElement | null>(null)
const currentDirectory = ref("")
const entries = ref<Array<FileSystemEntry>>([])
const loading = ref(false)
const loadError = ref<string | undefined>(undefined)

let loadRequestId = 0

const currentName = computed(() => pathName(currentDirectory.value))
const canGoParent = computed(() => {
  if (currentDirectory.value === "") return false

  return parentDirectory(currentDirectory.value) !== currentDirectory.value
})
const canCreate = computed(
  () => currentDirectory.value !== "" && !props.creating,
)

function open(): void {
  const element = popover.value
  if (element === null || element.matches(":popover-open")) return

  element.showPopover()
}

function close(): void {
  const element = popover.value
  if (element === null || !element.matches(":popover-open")) return

  element.hidePopover()
}

async function loadDirectory(path: string): Promise<void> {
  const requestId = ++loadRequestId

  loading.value = true
  loadError.value = undefined

  try {
    const nextEntries = unwrap(await fs.listEntries(path))

    if (requestId !== loadRequestId) return

    currentDirectory.value = path
    entries.value = directoryEntries(nextEntries)
  } catch (error) {
    if (requestId !== loadRequestId) return

    loadError.value = error instanceof Error ? error.message : String(error)
  } finally {
    if (requestId === loadRequestId) {
      loading.value = false
    }
  }
}

async function loadHomeDirectory(): Promise<void> {
  try {
    await loadDirectory(unwrap(await fs.home()))
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : String(error)
  }
}

async function goParent(): Promise<void> {
  if (currentDirectory.value === "") return

  const parent = parentDirectory(currentDirectory.value)
  if (parent === currentDirectory.value) return

  await loadDirectory(parent)
}

async function enterEntry(entry: FileSystemEntry): Promise<void> {
  if (entry.kind !== "Directory") return

  await loadDirectory(entry.path)
}

function submit(): void {
  if (!canCreate.value) return

  emit("create", {
    name: currentName.value,
    root: currentDirectory.value,
  })
}

function handleToggle(event: Event): void {
  const state = (event as Event & { newState?: string }).newState

  if (state === "open") {
    void loadHomeDirectory()
  }
}

defineExpose({ open, close })

function directoryEntries(
  entries: Array<FileSystemEntry>,
): Array<FileSystemEntry> {
  return entries
    .filter((entry) => entry.kind === "Directory")
    .sort((left, right) => {
      const leftHidden = left.name.startsWith(".")
      const rightHidden = right.name.startsWith(".")

      if (leftHidden !== rightHidden) {
        return leftHidden ? 1 : -1
      }

      return left.name.localeCompare(right.name)
    })
}

function pathName(value: string): string {
  const trimmed = value.replace(/[/\\]+$/, "")
  const index = Math.max(trimmed.lastIndexOf("/"), trimmed.lastIndexOf("\\"))

  return (index === -1 ? trimmed : trimmed.slice(index + 1)) || "/"
}

function normalizePath(path: string): string {
  if (path === "/") return path

  return path.replace(/[/\\]+$/, "")
}

function parentDirectory(path: string): string {
  const normalized = normalizePath(path)
  const index = Math.max(
    normalized.lastIndexOf("/"),
    normalized.lastIndexOf("\\"),
  )

  if (index === -1) return normalized
  if (index === 0) return "/"
  if (index === 2 && /^[A-Za-z]:/.test(normalized)) {
    return normalized.slice(0, 3)
  }

  return normalized.slice(0, index)
}
</script>

<template>
  <div
    :id="props.popoverId"
    ref="popover"
    popover="auto"
    class="w-[30rem] max-w-8/9 bg-transparent"
    :style="{
      position: 'fixed',
      inset: '0',
      margin: 'auto',
      overflow: 'visible',
    }"
    @toggle="handleToggle"
  >
    <Card as="form" class="flex h-full flex-col" @submit.prevent="submit">
      <template #tag>
        <h2 class="text-base font-semibold">
          {{ t("createWorkspace") }}
        </h2>
      </template>

      <div class="bg-paper flex h-[60svh] min-h-0 flex-col gap-3 p-3">
        <label class="flex shrink-0 flex-col gap-1">
          <span class="text-ink">{{ t("root") }}</span>
          <input
            :value="currentDirectory"
            class="border-line text-ink w-full rounded border bg-transparent px-2 py-1.5 font-mono outline-none"
            type="text"
            readonly
          />
        </label>

        <div
          class="border-line flex min-h-0 flex-1 flex-col overflow-hidden rounded border"
        >
          <header class="border-line flex h-10 shrink-0 items-center border-b">
            <button
              type="button"
              class="text-ink flex h-full min-w-0 flex-1 items-center px-3 text-left transition-colors"
              :class="
                canGoParent ? 'hover:bg-line cursor-pointer' : 'cursor-default'
              "
              :disabled="!canGoParent"
              :title="canGoParent ? t('goParent') : currentName"
              @click="goParent"
            >
              <span class="truncate">{{ currentName }}</span>
            </button>
          </header>

          <p v-if="loading" class="text-ink px-3 py-2">
            {{ t("loading") }}
          </p>

          <p
            v-else-if="loadError !== undefined"
            class="text-sign-error px-3 py-2"
          >
            {{ loadError }}
          </p>

          <p v-else-if="entries.length === 0" class="text-ink px-3 py-2">
            {{ t("emptyDirectory") }}
          </p>

          <ul v-else class="min-h-0 flex-1 overflow-y-auto">
            <li v-for="entry in entries" :key="entry.path">
              <button
                class="text-ink hover:bg-line flex w-full items-center gap-2 px-3 py-2 text-left transition-colors outline-none"
                type="button"
                @click="enterEntry(entry)"
              >
                <span class="truncate">{{ entry.name }}/</span>
              </button>
            </li>
          </ul>
        </div>

        <p v-if="props.error !== undefined" class="text-sign-error shrink-0">
          {{ props.error }}
        </p>

        <div class="flex shrink-0 flex-wrap items-center gap-2">
          <MediumButton type="submit" :disabled="!canCreate">
            {{ props.creating ? t("creating") : t("create") }}
          </MediumButton>
        </div>
      </div>
    </Card>
  </div>
</template>
