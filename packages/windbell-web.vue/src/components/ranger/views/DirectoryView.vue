<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { rangerMessages } from "../Ranger.i18n.ts"
import type { RangerDirectoryContent } from "../RangerContent.ts"

defineProps<{
  content: RangerDirectoryContent
}>()

const { t } = useI18n({
  messages: rangerMessages,
  useScope: "local",
})
</script>

<template>
  <div class="flex h-full min-h-0 flex-col overflow-hidden">
    <ol
      v-if="content.entries.length > 0"
      class="thin-scrollbar min-h-0 flex-1 overflow-y-auto"
    >
      <li
        v-for="child in content.entries"
        :key="child.path"
        class="w-full truncate px-4 py-1 text-ink"
      >
        {{ child.kind === "Directory" ? `${child.name}/` : child.name }}
      </li>
    </ol>

    <div v-else class="flex flex-1 items-center justify-center px-4 text-ink">
      {{ t("empty") }}
    </div>
  </div>
</template>
