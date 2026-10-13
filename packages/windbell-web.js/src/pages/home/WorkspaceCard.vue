<script setup lang="ts">
import { Pencil, Trash2 } from "@lucide/vue"
import type * as S from "@windbell/semiosis.js"
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { RouterLink } from "vue-router"
import Card from "../../components/card/Card.vue"
import SmallButton from "../../components/buttons/SmallButton.vue"
import {
  formatDateTime,
  formatRelativeTime,
} from "../../utils/datetime/index.ts"
import { homeMessages } from "./Home.i18n.ts"

const props = withDefaults(
  defineProps<{
    workspace: S.Workspace
    sessions: Array<S.SessionIndex>
    previewLimit?: number
  }>(),
  {
    previewLimit: 3,
  },
)

const emit = defineEmits<{
  updateTitle: [title: string]
  trash: []
}>()

const { locale, t } = useI18n({
  messages: homeMessages,
  useScope: "local",
})

const sessionListRoute = computed(() => ({
  name: "workspace",
  params: {
    workspaceId: props.workspace.id,
  },
}))

const sortedSessions = computed(() =>
  [...props.sessions].sort(
    (a, b) => b.updatedAt - a.updatedAt || b.createdAt - a.createdAt,
  ),
)

const previewSessions = computed(() =>
  sortedSessions.value.slice(0, Math.max(0, props.previewLimit)),
)

function formatSessionRelativeTime(value: number): string {
  return formatRelativeTime(value, {
    locale: locale.value,
  })
}

function requestEditTitle(): void {
  const title = window.prompt(t("editTitlePrompt"), props.workspace.name)
  if (title === null) return

  const nextTitle = title.trim()
  if (nextTitle === "" || nextTitle === props.workspace.name) return

  emit("updateTitle", nextTitle)
}

function requestTrash(): void {
  if (!window.confirm(t("trashConfirm"))) return

  emit("trash")
}
</script>

<template>
  <Card as="article">
    <template #tag>
      <RouterLink class="block min-w-0" :to="sessionListRoute">
        <h2 class="truncate">
          {{ workspace.name }}
        </h2>
      </RouterLink>
    </template>

    <div class="flex flex-col gap-2 px-3 py-2">
      <RouterLink class="block min-w-0" :to="sessionListRoute">
        <p class="truncate font-mono text-sm" :title="workspace.root">
          {{ workspace.root }}
        </p>
      </RouterLink>

      <div class="flex items-center gap-2">
        <SmallButton type="button" @click="requestEditTitle">
          <Pencil :size="16" :stroke-width="1.5" aria-hidden="true" />
          <span>{{ t("editTitle") }}</span>
        </SmallButton>

        <SmallButton type="button" @click="requestTrash">
          <Trash2 :size="16" :stroke-width="1.5" aria-hidden="true" />
          <span>{{ t("trash") }}</span>
        </SmallButton>
      </div>

      <ul v-if="previewSessions.length > 0" class="flex flex-col gap-1">
        <li
          v-for="session in previewSessions"
          :key="session.id"
          class="markdown-list-item flex min-w-0 items-baseline"
        >
          <span class="markdown-list-marker" aria-hidden="true">* </span>
          <RouterLink
            class="min-w-0 flex-1 truncate hover:underline"
            :to="{ name: 'session', params: { sessionId: session.id } }"
          >
            <span class="truncate">{{ session.title }}</span>
          </RouterLink>
          <span
            class="shrink-0 text-xs text-ink/60"
            :title="formatDateTime(session.updatedAt)"
          >
            {{ formatSessionRelativeTime(session.updatedAt) }}
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
          {{ t("updatedAt") }}{{ t("colon")
          }}{{ formatDateTime(workspace.updatedAt) }}
        </p>
        <p class="truncate">
          {{ t("createdAt") }}{{ t("colon")
          }}{{ formatDateTime(workspace.createdAt) }}
        </p>
      </div>
    </template>
  </Card>
</template>
