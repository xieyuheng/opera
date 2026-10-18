<script setup lang="ts">
import { useHead } from "@unhead/vue"
import { ref } from "vue"
import { useI18n } from "vue-i18n"
import { useRouter } from "vue-router"
import { useTheme, type Theme } from "../../app/theme.ts"
import MediumButton from "../../components/buttons/MediumButton.vue"
import SmallButton from "../../components/buttons/SmallButton.vue"
import PageLayout from "../../components/layout/PageLayout.vue"
import ThemeCard from "./ThemeCard.vue"
import { themeListMessages } from "./ThemeList.i18n.ts"

const { t } = useI18n({
  messages: themeListMessages,
  useScope: "local",
})
const router = useRouter()
const {
  state,
  activeTheme,
  builtInThemes,
  activateTheme,
  createCustomTheme,
  deleteCustomTheme,
} = useTheme()

const error = ref<string | undefined>(undefined)

async function handleActivate(theme: Theme): Promise<void> {
  error.value = undefined

  try {
    await activateTheme(theme.id)
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : String(caught)
  }
}

async function handleDuplicate(theme: Theme): Promise<void> {
  error.value = undefined

  try {
    const created = await createCustomTheme({
      name: `${theme.name} Copy`,
      colors: {
        light: { ...theme.colors.light },
        dark: { ...theme.colors.dark },
      },
    })

    await router.push({
      name: "theme",
      params: { themeId: created.id },
    })
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : String(caught)
  }
}

async function handleDelete(theme: Theme): Promise<void> {
  if (!window.confirm(t("confirmDelete", { name: theme.name }))) return

  error.value = undefined

  try {
    await deleteCustomTheme(theme.id)
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : String(caught)
  }
}

function openTheme(theme: Theme): void {
  void router.push({
    name: "theme",
    params: { themeId: theme.id },
  })
}

function openNewTheme(): void {
  void router.push({
    name: "theme-new",
  })
}

useHead(() => ({
  title: t("title"),
}))
</script>

<template>
  <PageLayout>
    <header class="flex flex-col gap-3">
      <h1 class="text-xl text-ink font-semibold">
        {{ t("title") }}
      </h1>

      <div class="flex flex-wrap items-center gap-2">
        <MediumButton :to="{ name: 'settings' }">
          <span>{{ t("app.back") }}</span>
        </MediumButton>
      </div>
    </header>

    <p
      v-if="error"
      class="rounded border border-sign-error/60 px-3 py-2 text-sm text-sign-error"
    >
      {{ error }}
    </p>

    <div class="flex flex-col gap-2">
      <h2 class="text-base text-ink font-semibold">
        {{ t("builtInThemes") }}
      </h2>
    </div>

    <ul class="flex flex-col gap-4">
      <li v-for="theme in builtInThemes" :key="theme.id">
        <ThemeCard :theme="theme" @select="openTheme(theme)">
          <template #toolbar>
            <SmallButton
              :disabled="activeTheme.id === theme.id"
              @click="handleActivate(theme)"
            >
              {{ activeTheme.id === theme.id ? t("active") : t("use") }}
            </SmallButton>

            <SmallButton @click="handleDuplicate(theme)">
              {{ t("duplicate") }}
            </SmallButton>
          </template>
        </ThemeCard>
      </li>
    </ul>

    <div class="flex flex-col gap-2">
      <h2 class="text-base text-ink font-semibold">
        {{ t("customThemes") }}
      </h2>

      <MediumButton class="self-start" @click="openNewTheme">
        <span>{{ t("newTheme") }}</span>
      </MediumButton>
    </div>

    <p v-if="state.customThemes.length === 0" class="text-sm text-ink">
      {{ t("noCustomThemes") }}
    </p>

    <ul v-else class="flex flex-col gap-4">
      <li v-for="theme in state.customThemes" :key="theme.id">
        <ThemeCard :theme="theme" @select="openTheme(theme)">
          <template #toolbar>
            <SmallButton
              :disabled="activeTheme.id === theme.id"
              @click="handleActivate(theme)"
            >
              {{ activeTheme.id === theme.id ? t("active") : t("use") }}
            </SmallButton>

            <SmallButton @click="handleDuplicate(theme)">
              {{ t("duplicate") }}
            </SmallButton>

            <SmallButton @click="handleDelete(theme)">
              {{ t("delete") }}
            </SmallButton>
          </template>
        </ThemeCard>
      </li>
    </ul>
  </PageLayout>
</template>
