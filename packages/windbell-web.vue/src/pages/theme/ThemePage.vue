<script setup lang="ts">
import { useHead } from "@unhead/vue"
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue"
import { useI18n } from "vue-i18n"
import { useRoute, useRouter } from "vue-router"
import { useColorMode } from "../../app/color-mode.ts"
import {
  builtInThemes,
  findThemeById,
  isBuiltInTheme,
  setPreviewTheme,
  useTheme,
  waitForThemeData,
  type Theme,
  type ThemeColorName,
} from "../../app/theme.ts"
import ColorPicker from "../../components/color-picker/ColorPicker.vue"
import MediumButton from "../../components/buttons/MediumButton.vue"
import SmallButton from "../../components/buttons/SmallButton.vue"
import Card from "../../components/card/Card.vue"
import PageLayout from "../../components/layout/PageLayout.vue"
import { themeMessages } from "./Theme.i18n.ts"

const { t } = useI18n({
  messages: themeMessages,
  useScope: "local",
})
const route = useRoute()
const router = useRouter()
const colorMode = useColorMode()
const themes = useTheme()
const activeTheme = themes.activeTheme

const themeId = computed(() => String(route.params.themeId ?? ""))
const isNew = computed(
  () => route.name === "theme-new" || themeId.value === "new",
)
const existingTheme = computed(() => findThemeById(themeId.value))
const isBuiltIn = computed(() => isBuiltInTheme(themeId.value))

const draft = reactive<Theme>(makeDraft())
const selectedMode = ref<"light" | "dark">(colorMode.resolved)
const saving = ref(false)
const ready = ref(isNew.value || existingTheme.value !== undefined)
const error = ref<string | undefined>(undefined)

const colorGroups: Array<{
  labelKey: string
  tokens: Array<ThemeColorName>
}> = [
  {
    labelKey: "baseColors",
    tokens: ["paper", "ink", "line"],
  },
  {
    labelKey: "signColors",
    tokens: [
      "sign-persona",
      "sign-user",
      "sign-reasoning",
      "sign-assistant",
      "sign-provider-data",
      "sign-tool-call",
      "sign-tool",
      "sign-tool-output",
      "sign-error",
    ],
  },
]

function makeDraft(): Theme {
  const theme = isNew.value
    ? builtInThemes[0]!
    : (existingTheme.value ?? builtInThemes[0]!)

  return {
    id: isNew.value ? "" : theme.id,
    name: isNew.value ? "New Theme" : theme.name,
    colors: {
      light: { ...theme.colors.light },
      dark: { ...theme.colors.dark },
    },
  }
}

function cloneDraft(): Theme {
  return {
    id: draft.id,
    name: draft.name,
    colors: {
      light: { ...draft.colors.light },
      dark: { ...draft.colors.dark },
    },
  }
}

function selectMode(mode: "light" | "dark"): void {
  colorMode.setPreference(mode)
  selectedMode.value = mode
}

function updateColor(
  mode: "light" | "dark",
  token: ThemeColorName,
  value: string,
): void {
  draft.colors[mode][token] = value
  refreshPreview()
}

function refreshPreview(): void {
  setPreviewTheme(cloneDraft())
}

async function handleSave(): Promise<void> {
  if (!ready.value || isBuiltIn.value) return

  saving.value = true
  error.value = undefined

  try {
    const saved =
      isNew.value || existingTheme.value === undefined
        ? await themes.createCustomTheme({
            name: draft.name,
            colors: cloneDraft().colors,
          })
        : await themes.updateCustomTheme(cloneDraft())

    Object.assign(draft, saved)
    setPreviewTheme(cloneDraft())

    if (isNew.value) {
      await router.replace({
        name: "theme",
        params: { themeId: saved.id },
      })
    }
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : String(caught)
  } finally {
    saving.value = false
  }
}

async function handleActivate(): Promise<void> {
  if (isNew.value || existingTheme.value === undefined) return
  if (activeTheme.value.id === draft.id) return

  saving.value = true
  error.value = undefined

  try {
    await themes.activateTheme(draft.id)
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : String(caught)
  } finally {
    saving.value = false
  }
}

async function handleDuplicate(): Promise<void> {
  if (isNew.value || existingTheme.value === undefined) return

  saving.value = true
  error.value = undefined

  try {
    const created = await themes.createCustomTheme({
      name: `${draft.name} Copy`,
      colors: cloneDraft().colors,
    })

    await router.push({
      name: "theme",
      params: { themeId: created.id },
    })
    Object.assign(draft, makeDraft())
    setPreviewTheme(cloneDraft())
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : String(caught)
  } finally {
    saving.value = false
  }
}

async function handleDelete(): Promise<void> {
  if (
    !ready.value ||
    isBuiltIn.value ||
    isNew.value ||
    existingTheme.value === undefined
  ) {
    return
  }
  if (!window.confirm(t("confirmDelete", { name: draft.name }))) return

  saving.value = true
  error.value = undefined

  try {
    setPreviewTheme(undefined)
    await themes.deleteCustomTheme(draft.id)
    await router.push({ name: "theme-list" })
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : String(caught)
  } finally {
    saving.value = false
  }
}

let disposed = false

onMounted(async () => {
  if (!isNew.value) {
    await waitForThemeData()
    if (disposed) return

    if (existingTheme.value === undefined) {
      void router.replace({ name: "theme-list" })
      return
    }

    // 数据加载完成后，用真实主题覆盖初始化时回退到内置主题的草稿
    Object.assign(draft, makeDraft())
  }

  ready.value = true
  setPreviewTheme(cloneDraft())
})

onBeforeUnmount(() => {
  disposed = true
  setPreviewTheme(undefined)
})

useHead(() => ({
  title: t("title"),
}))
</script>

<template>
  <PageLayout>
    <header class="flex flex-col gap-3">
      <h1 class="text-xl text-ink font-semibold">
        {{ isNew ? t("newTheme") : t("title") }}
      </h1>

      <div class="flex flex-wrap items-center gap-2">
        <MediumButton :to="{ name: 'theme-list' }">
          <span>{{ t("app.back") }}</span>
        </MediumButton>

        <MediumButton
          v-if="!isNew && ready"
          :disabled="saving || activeTheme.id === draft.id"
          @click="handleActivate"
        >
          {{ activeTheme.id === draft.id ? t("active") : t("use") }}
        </MediumButton>

        <MediumButton
          v-if="!isNew && ready"
          :disabled="saving"
          @click="handleDuplicate"
        >
          {{ t("duplicate") }}
        </MediumButton>

        <MediumButton
          v-if="!isBuiltIn"
          :disabled="saving || !ready"
          @click="handleSave"
        >
          {{ t("save") }}
        </MediumButton>
        <MediumButton
          v-if="!isNew && !isBuiltIn"
          :disabled="saving || !ready"
          @click="handleDelete"
        >
          {{ t("delete") }}
        </MediumButton>
      </div>
    </header>

    <p
      v-if="error"
      class="rounded border border-sign-error/60 px-3 py-2 text-sign-error"
    >
      {{ error }}
    </p>

    <p v-if="!ready">
      {{ t("loading") }}
    </p>

    <template v-else>
      <Card as="section">
        <template #tag>
          <h2 class="text-ink">{{ t("name") }}</h2>
        </template>

        <div class="p-3">
          <input
            v-model="draft.name"
            class="w-full rounded border border-line bg-paper px-3 py-2 text-ink outline-none focus:border-ink"
            type="text"
            @input="refreshPreview"
          />
        </div>
      </Card>

      <Card as="section">
        <template #tag>
          <div class="flex items-center gap-4">
            <button
              class="text-ink"
              :class="selectedMode === 'light' ? 'font-bold' : 'opacity-60'"
              type="button"
              @click="selectMode('light')"
            >
              {{ t("light") }}
            </button>
            <button
              class="text-ink"
              :class="selectedMode === 'dark' ? 'font-bold' : 'opacity-60'"
              type="button"
              @click="selectMode('dark')"
            >
              {{ t("dark") }}
            </button>
          </div>
        </template>

        <div class="flex flex-col gap-6 p-3">
          <section
            v-for="group in colorGroups"
            :key="group.labelKey"
            class="flex flex-col gap-3"
          >
            <h3 class="font-semibold text-ink">
              {{ t(group.labelKey) }}
            </h3>

            <div class="grid gap-4 md:grid-cols-2">
              <Card v-for="token in group.tokens" :key="token">
                <template #tag>
                  <span class="font-mono font-semibold">
                    --color-{{ token }}
                  </span>
                </template>

                <ColorPicker
                  class="p-2"
                  :model-value="draft.colors[selectedMode][token]"
                  @update:modelValue="updateColor(selectedMode, token, $event)"
                />
              </Card>
            </div>
          </section>
        </div>
      </Card>
    </template>
  </PageLayout>
</template>
