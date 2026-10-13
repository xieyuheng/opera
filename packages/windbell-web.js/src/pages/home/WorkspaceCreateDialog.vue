<script setup lang="ts">
import { makeHttpFileSystemClient } from "@windbell/fs-api.js/client"
import type { FileSystemEntry } from "@windbell/fs.js/fs"
import { unwrap } from "@windbell/std.js/result"
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import MediumButton from "../../components/buttons/MediumButton.vue"
import { homeMessages } from "./Home.i18n.ts"

const props = defineProps<{
  creating: boolean
  error?: string
}>()

const emit = defineEmits<{
  close: []
  create: [options: { name: string; root: string }]
}>()

const { t } = useI18n({
  messages: homeMessages,
  useScope: "local",
})

const fs = makeHttpFileSystemClient({
  baseUrl: "/api/fs",
})

const currentDirectory = ref("")
const entries = ref<Array<FileSystemEntry>>([])
const selectedIndex = ref(-1)
const list = ref<HTMLUListElement | null>(null)
const previewEntries = ref<Array<FileSystemEntry>>([])
const loading = ref(false)
const loadError = ref<string | undefined>(undefined)
const previewLoading = ref(false)
const previewError = ref<string | undefined>(undefined)
const name = ref("")

let previewRequestId = 0

const selectedEntry = computed(() => entries.value[selectedIndex.value])
const canCreate = computed(
  () =>
    selectedEntry.value !== undefined &&
    name.value.trim() !== "" &&
    !props.creating,
)

async function loadDirectory(path: string): Promise<void> {
  loading.value = true
  loadError.value = undefined

  try {
    const nextEntries = unwrap(await fs.listEntries(path))
    const directories = directoryEntries(nextEntries)

    currentDirectory.value = path
    entries.value = directories
    selectedIndex.value = directories.length === 0 ? -1 : 0
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : String(error)
  } finally {
    loading.value = false
  }
}

async function loadPreview(): Promise<void> {
  const entry = selectedEntry.value
  const requestId = ++previewRequestId

  previewEntries.value = []
  previewError.value = undefined

  if (entry === undefined || entry.kind !== "Directory") {
    previewLoading.value = false
    return
  }

  previewLoading.value = true

  try {
    const nextEntries = unwrap(await fs.listEntries(entry.path))

    if (requestId !== previewRequestId) return

    previewEntries.value = directoryEntries(nextEntries)
  } catch (error) {
    if (requestId !== previewRequestId) return

    previewError.value = error instanceof Error ? error.message : String(error)
  } finally {
    if (requestId === previewRequestId) {
      previewLoading.value = false
    }
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

async function enterSelectedEntry(): Promise<void> {
  const entry = selectedEntry.value
  if (entry === undefined) return

  await enterEntry(entry)
}

function selectEntry(index: number): void {
  if (index < 0 || index >= entries.value.length) return

  selectedIndex.value = index
}

function moveSelection(delta: number): void {
  if (entries.value.length === 0) return

  const index = selectedIndex.value + delta
  if (index < 0 || index >= entries.value.length) return

  selectEntry(index)
}

function submit(): void {
  const entry = selectedEntry.value
  if (!canCreate.value || entry === undefined) return

  emit("create", {
    name: name.value.trim(),
    root: entry.path,
  })
}

function isTextInput(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false

  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target.isContentEditable
  )
}

async function handleKeydown(event: KeyboardEvent): Promise<void> {
  if (event.key === "Escape") {
    if (!props.creating) emit("close")
    return
  }

  if (isTextInput(event.target)) return

  switch (event.key) {
    case "ArrowUp": {
      event.preventDefault()
      moveSelection(-1)
      return
    }

    case "ArrowDown": {
      event.preventDefault()
      moveSelection(1)
      return
    }

    case "ArrowLeft": {
      event.preventDefault()
      await goParent()
      return
    }

    case "ArrowRight": {
      const entry = selectedEntry.value
      if (entry?.kind !== "Directory") return

      event.preventDefault()
      await enterEntry(entry)
      return
    }

    case "Enter": {
      event.preventDefault()
      submit()
      return
    }
  }
}

function onKeydown(event: KeyboardEvent): void {
  void handleKeydown(event)
}

watch(selectedEntry, () => {
  name.value = selectedEntry.value?.name ?? ""
  void loadPreview()
})

watch(selectedIndex, async (index) => {
  await nextTick()

  const item = list.value?.children[index] as HTMLElement | undefined
  const button = item?.querySelector<HTMLButtonElement>("button")

  button?.focus({ preventScroll: true })
  item?.scrollIntoView({ block: "nearest" })
})

onMounted(async () => {
  window.addEventListener("keydown", onKeydown)

  try {
    await loadDirectory(unwrap(await fs.home()))
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : String(error)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown)
})

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
    class="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4"
    @click.self="!props.creating && emit('close')"
  >
    <form
      class="flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border-x-3 border-b-3 border-line bg-paper text-ink"
      @submit.prevent="submit"
    >
      <header class="shrink-0 bg-line px-3 py-2">
        <div>
          <h2 class="text-base">
            {{ t("createWorkspace") }}
          </h2>
          <p class="mt-1 text-xs text-ink">
            {{ t("createWorkspaceHint") }}
          </p>
        </div>
      </header>

      <div class="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-4">
        <div
          class="grid h-64 shrink-0 grid-cols-2 overflow-hidden rounded border border-line"
        >
          <div class="thin-scrollbar h-full overflow-y-auto">
            <p v-if="loading" class="px-3 py-2 text-ink">
              {{ t("loading") }}
            </p>

            <p
              v-else-if="loadError !== undefined"
              class="px-3 py-2 text-sign-error"
            >
              {{ loadError }}
            </p>

            <p v-else-if="entries.length === 0" class="px-3 py-2 text-ink">
              {{ t("emptyDirectory") }}
            </p>

            <ul v-else ref="list" class="flex flex-col">
              <li v-for="(entry, index) in entries" :key="entry.path">
                <button
                  class="flex w-full items-center gap-2 px-3 py-2 text-left outline-none transition-colors"
                  :class="
                    index === selectedIndex
                      ? 'bg-ink/15 text-ink'
                      : 'hover:bg-line'
                  "
                  type="button"
                  @click="selectEntry(index)"
                  @dblclick="enterEntry(entry)"
                >
                  <span class="truncate">{{ entry.name }}/</span>
                </button>
              </li>
            </ul>
          </div>

          <div
            class="thin-scrollbar h-full overflow-y-auto border-l border-line"
          >
            <p v-if="selectedEntry === undefined" class="px-3 py-2 text-ink">
              {{ t("noSelection") }}
            </p>

            <p v-else-if="previewLoading" class="px-3 py-2 text-ink">
              {{ t("loading") }}
            </p>

            <p
              v-else-if="previewError !== undefined"
              class="px-3 py-2 text-sign-error"
            >
              {{ previewError }}
            </p>

            <p
              v-else-if="previewEntries.length === 0"
              class="px-3 py-2 text-ink"
            >
              {{ t("emptyDirectory") }}
            </p>

            <ul v-else class="flex flex-col">
              <li v-for="entry in previewEntries" :key="entry.path">
                <div class="flex items-center gap-2 px-3 py-2">
                  <span class="truncate">{{ entry.name }}/</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label class="flex flex-col gap-1 text-sm">
            <span class="text-ink">{{ t("root") }}</span>
            <input
              :value="selectedEntry?.path ?? ''"
              class="w-full rounded border border-line bg-transparent px-2 py-1.5 font-mono text-ink outline-none"
              type="text"
              readonly
            />
          </label>

          <label class="flex flex-col gap-1 text-sm">
            <span class="text-ink">{{ t("nameEditable") }}</span>
            <input
              v-model="name"
              class="w-full rounded border border-line bg-transparent px-2 py-1.5 text-ink outline-none placeholder:text-ink disabled:opacity-50"
              type="text"
              :disabled="selectedEntry === undefined"
            />
          </label>
        </div>

        <p v-if="props.error !== undefined" class="text-sm text-sign-error">
          {{ props.error }}
        </p>

        <div class="flex flex-wrap items-center gap-2">
          <MediumButton
            type="button"
            :disabled="props.creating"
            @click="emit('close')"
          >
            {{ t("cancel") }}
          </MediumButton>

          <MediumButton type="submit" :disabled="!canCreate">
            {{ props.creating ? t("creating") : t("create") }}
          </MediumButton>
        </div>
      </div>
    </form>
  </div>
</template>
