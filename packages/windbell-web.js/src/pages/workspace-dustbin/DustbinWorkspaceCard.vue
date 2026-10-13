<script setup lang="ts">
import { ArchiveRestore, Trash2 } from "@lucide/vue"
import type * as S from "@windbell/semiosis.js"
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import Card from "../../components/card/Card.vue"
import SmallButton from "../../components/buttons/SmallButton.vue"
import {
  formatDateTime,
  formatRelativeTime,
} from "../../utils/datetime/index.ts"
import { workspaceDustbinMessages } from "./WorkspaceDustbin.i18n.ts"

const props = withDefaults(
  defineProps<{
    workspace: S.DustbinWorkspace
    sessions: Array<S.DustbinSessionIndex>
    busy?: boolean
    previewLimit?: number
  }>(),
  {
    busy: false,
    previewLimit: 3,
  },
)

const emit = defineEmits<{
  restore: []
  remove: []
}>()

const { locale, t } = useI18n({
  messages: workspaceDustbinMessages,
  useScope: "local",
})

const sortedSessions = computed(() =>
  [...props.sessions].sort((a, b) => b.deletedAt - a.deletedAt),
)

const previewSessions = computed(() =>
  sortedSessions.value.slice(0, Math.max(0, props.previewLimit)),
)

function formatSessionRelativeTime(value: number): string {
  return formatRelativeTime(value, {
    locale: locale.value,
  })
}

function requestRemove(): void {
  if (!window.confirm(t("deleteConfirm"))) return

  emit("remove")
}
</script>

<template>
  <Card as="article">
    <template #tag>
      <h2 class="truncate">
        {{ workspace.name }}
      </h2>
    </template>

    <div class="flex flex-col gap-2 px-3 py-2">
      <p class="truncate font-mono text-sm" :title="workspace.root">
        {{ workspace.root }}
      </p>

      <div class="flex items-center gap-2">
        <SmallButton
          type="button"
          :disabled="busy"
          :title="t('restoreHint')"
          @click="emit('restore')"
        >
          <ArchiveRestore :size="16" :stroke-width="1.5" aria-hidden="true" />
          <span>{{ t("restore") }}</span>
        </SmallButton>

        <SmallButton type="button" :disabled="busy" @click="requestRemove">
          <Trash2 :size="16" :stroke-width="1.5" aria-hidden="true" />
          <span>{{ t("remove") }}</span>
        </SmallButton>
      </div>

      <ul v-if="previewSessions.length > 0" class="flex flex-col gap-1">
        <li
          v-for="session in previewSessions"
          :key="session.id"
          class="flex min-w-0 items-baseline justify-between"
        >
          <span class="truncate">{{ session.title }}</span>
          <span
            class="shrink-0 text-xs text-ink/60"
            :title="formatDateTime(session.deletedAt)"
          >
            {{ formatSessionRelativeTime(session.deletedAt) }}
          </span>
        </li>
      </ul>

      <p v-else class="text-sm text-ink/70">
        {{ t("noSessions") }}
      </p>
    </div>

    <template #footer>
      <div class="flex flex-col gap-1 text-sm">
        <p class="truncate">
          {{ t("sessionCount") }}{{ t("colon") }}{{ sessions.length }}
        </p>
        <p class="truncate">
          {{ t("deletedAt") }}{{ t("colon")
          }}{{ formatDateTime(workspace.deletedAt) }}
        </p>
        <p class="truncate">
          {{ t("createdAt") }}{{ t("colon")
          }}{{ formatDateTime(workspace.createdAt) }}
        </p>
      </div>
    </template>
  </Card>
</template>
