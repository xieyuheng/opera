<script setup lang="ts">
import { useHead } from "@unhead/vue"
import type * as S from "@windbell/semiosis.ts/core"
import { ref } from "vue"
import { useI18n } from "vue-i18n"

import MediumButton from "../../components/buttons/MediumButton.vue"
import PageLayout from "../../components/layout/PageLayout.vue"
import { homeMessages } from "./Home.i18n.ts"
import {
  ensureWorkspace,
  getHomeState,
  trashWorkspace,
  updateWorkspaceTitle,
} from "./HomeState.ts"
import HomeWelcomeCard from "./HomeWelcomeCard.vue"
import WorkspaceCard from "./WorkspaceCard.vue"
import WorkspaceCreateDialog from "./WorkspaceCreateDialog.vue"

const { t } = useI18n({
  messages: homeMessages,
  useScope: "local",
})
const state = getHomeState()
const workspaceCreatePopoverId = "workspace-create-popover"
const createDialog = ref<InstanceType<typeof WorkspaceCreateDialog> | null>(
  null,
)
const creating = ref(false)
const createError = ref<string | undefined>(undefined)

function openCreateDialog(): void {
  createError.value = undefined
  createDialog.value?.open()
}

async function createWorkspace(options: {
  name: string
  root: string
}): Promise<void> {
  creating.value = true
  createError.value = undefined

  try {
    await ensureWorkspace(state, options)
    createDialog.value?.close()
  } catch (error) {
    createError.value = error instanceof Error ? error.message : String(error)
  } finally {
    creating.value = false
  }
}

async function handleTrashWorkspace(workspace: S.Workspace): Promise<void> {
  try {
    await trashWorkspace(state, workspace.id)
  } catch (error) {
    state.error = error instanceof Error ? error.message : String(error)
  }
}

async function handleUpdateWorkspaceTitle(
  workspace: S.Workspace,
  name: string,
): Promise<void> {
  try {
    await updateWorkspaceTitle(state, workspace.id, name)
  } catch (error) {
    state.error = error instanceof Error ? error.message : String(error)
  }
}

useHead(() => ({
  title: t("title"),
  meta: [
    {
      name: "description",
      content: t("description"),
    },
  ],
}))
</script>

<template>
  <PageLayout>
    <header class="flex flex-col gap-3">
      <h1 class="text-ink text-xl font-semibold">
        {{ t("title") }}
      </h1>

      <div class="flex flex-wrap items-center gap-2">
        <MediumButton :to="{ name: 'settings' }">
          <span>{{ t("app.settings") }}</span>
        </MediumButton>

        <MediumButton :to="{ name: 'toolbox' }">
          <span>{{ t("toolbox") }}</span>
        </MediumButton>
      </div>
    </header>

    <div class="flex flex-col gap-2">
      <h2 class="text-ink text-base font-semibold">
        {{ t("workspaces") }}
      </h2>

      <div class="flex flex-wrap items-center gap-2">
        <MediumButton
          type="button"
          :popovertarget="workspaceCreatePopoverId"
          popovertargetaction="toggle"
          @click="createError = undefined"
        >
          <span>{{ t("newWorkspace") }}</span>
        </MediumButton>

        <MediumButton :to="{ name: 'workspace-dustbin' }">
          <span>{{ t("workspaceDustbin") }}</span>
        </MediumButton>
      </div>
    </div>

    <p
      v-if="state.error !== undefined && state.hasLoaded"
      class="text-sign-error"
    >
      {{ state.error }}
    </p>

    <p v-if="state.isLoading" class="text-ink">
      {{ t("loading") }}
    </p>

    <p
      v-else-if="state.error !== undefined && !state.hasLoaded"
      class="text-sign-error"
    >
      {{ state.error }}
    </p>

    <ul
      v-else-if="state.workspaces.length > 0"
      class="flex flex-col gap-4"
      :class="{ 'opacity-60': state.isPending }"
      :aria-busy="state.isPending"
    >
      <li v-for="workspace in state.workspaces" :key="workspace.id">
        <WorkspaceCard
          :workspace="workspace"
          :sessions="state.sessionsByWorkspaceId[workspace.id] ?? []"
          :preview-limit="5"
          @trash="handleTrashWorkspace(workspace)"
          @update-title="handleUpdateWorkspaceTitle(workspace, $event)"
        />
      </li>
    </ul>

    <HomeWelcomeCard v-else @create="openCreateDialog" />

    <WorkspaceCreateDialog
      ref="createDialog"
      :popover-id="workspaceCreatePopoverId"
      :creating="creating"
      :error="createError"
      @create="createWorkspace"
    />
  </PageLayout>
</template>
