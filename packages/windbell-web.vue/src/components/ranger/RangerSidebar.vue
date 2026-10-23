<script setup lang="ts">
import type { FileSystemEntry } from "@xieyuheng/fs.ts/fs"
import { computed, nextTick, ref, watch } from "vue"
import { useI18n } from "vue-i18n"

import { rangerMessages } from "./Ranger.i18n.ts"
import { isSamePath } from "./RangerPath.ts"

const props = defineProps<{
  root: string
  currentDirectory: string
  entries: Array<FileSystemEntry>
  selectedIndex: number
  focus: "sidebar" | "view"
  mobile?: boolean
  expanded?: boolean
}>()

const emit = defineEmits<{
  select: [index: number]
  goParent: []
  toggle: []
  close: []
}>()

const { t } = useI18n({
  messages: rangerMessages,
  useScope: "local",
})

const list = ref<HTMLOListElement | null>(null)

watch(
  () => props.selectedIndex,
  async (index) => {
    await nextTick()

    const item = list.value?.children[index] as HTMLElement | undefined
    item?.scrollIntoView({ block: "nearest" })
  },
)

const currentName = computed(() => {
  return pathName(props.currentDirectory || props.root)
})

const canGoParent = computed(() => {
  const directory = props.currentDirectory || props.root

  return directory !== "" && !isSamePath(directory, props.root)
})

function pathName(value: string): string {
  const trimmed = value.replace(/[/\\]+$/, "")
  const index = Math.max(trimmed.lastIndexOf("/"), trimmed.lastIndexOf("\\"))

  return (index === -1 ? trimmed : trimmed.slice(index + 1)) || "/"
}

const headerTitle = computed(() =>
  canGoParent.value ? t("goParent") : currentName.value,
)

function handleHeaderClick(): void {
  if (canGoParent.value) {
    emit("goParent")
  }
}
</script>

<template>
  <aside
    class="bg-paper flex min-h-0 flex-col overflow-hidden transition-[height] duration-200"
  >
    <header
      class="border-line flex h-10 shrink-0 items-center border-t border-b sm:border-t-0"
      :class="{
        'border-b-0': !props.expanded,
      }"
    >
      <button
        type="button"
        class="text-ink flex h-full min-w-0 flex-1 items-center gap-1 px-3 text-left transition-colors"
        :class="canGoParent ? 'hover:bg-line cursor-pointer' : 'cursor-default'"
        :disabled="!canGoParent"
        :title="headerTitle"
        @click="handleHeaderClick"
      >
        <span class="truncate">{{ currentName }}</span>
      </button>

      <button
        v-if="props.mobile"
        type="button"
        class="text-ink hover:bg-line h-full shrink-0 px-2 text-sm transition-colors"
        :aria-expanded="props.expanded"
        :aria-label="props.expanded ? t('collapseSidebar') : t('expandSidebar')"
        :title="props.expanded ? t('collapseSidebar') : t('expandSidebar')"
        @click.stop="emit('toggle')"
      >
        {{ props.expanded ? t("collapseSidebar") : t("expandSidebar") }}
      </button>

      <button
        v-if="mobile"
        type="button"
        class="text-ink hover:bg-line h-full shrink-0 px-2 text-sm transition-colors"
        @click.stop="emit('close')"
      >
        {{ t("close") }}
      </button>
    </header>

    <ol
      v-show="!props.mobile || props.expanded"
      ref="list"
      class="min-h-0 flex-1 overflow-y-auto"
    >
      <li
        v-for="(entry, index) in entries"
        :key="entry.path"
        class="w-full cursor-pointer truncate px-3 py-1"
        :class="[
          index === selectedIndex
            ? focus === 'sidebar'
              ? 'bg-ink text-paper'
              : 'bg-ink/15 text-ink'
            : 'text-ink hover:bg-line',
        ]"
        @click="emit('select', index)"
      >
        {{ entry.kind === "Directory" ? `${entry.name}/` : entry.name }}
      </li>
    </ol>
  </aside>
</template>
