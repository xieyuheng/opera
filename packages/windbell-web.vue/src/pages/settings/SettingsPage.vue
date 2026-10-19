<script setup lang="ts">
import { useHead } from "@unhead/vue"
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"

import { useColorMode, type ColorModePreference } from "../../app/color-mode.ts"
import { useFont, type Font } from "../../app/font.ts"
import { setLocale, supportedLocales } from "../../app/i18n.ts"
import MediumButton from "../../components/buttons/MediumButton.vue"
import Card from "../../components/card/Card.vue"
import PageLayout from "../../components/layout/PageLayout.vue"
import { settingsMessages } from "./Settings.i18n.ts"
import {
  clearStorageKeys,
  clearWindbellStorage,
  readWindbellStorage,
  type StorageGroup,
} from "./SettingsStorage.ts"

const { locale, t } = useI18n({
  messages: settingsMessages,
  useScope: "local",
})
const colorMode = useColorMode()
const font = useFont()
const storageEntries = ref(readWindbellStorage())
const storageGroupLabelKeys: Record<StorageGroup, string> = {
  app: "storageApp",
  ranger: "storageRanger",
  session: "storageSession",
  other: "storageOther",
}
const storageGroups = computed(() => {
  const order: Array<StorageGroup> = ["app", "ranger", "session", "other"]

  return order
    .map((id) => {
      const entries = storageEntries.value.filter((entry) => entry.group === id)

      return {
        id,
        labelKey: storageGroupLabelKeys[id],
        count: entries.length,
        bytes: entries.reduce((sum, entry) => sum + entry.bytes, 0),
      }
    })
    .filter((group) => group.count > 0)
})
const storageTotalBytes = computed(() =>
  storageEntries.value.reduce((sum, entry) => sum + entry.bytes, 0),
)
const hasSessionStorage = computed(() =>
  storageEntries.value.some((entry) => entry.group === "session"),
)

function refreshStorage(): void {
  storageEntries.value = readWindbellStorage()
}

function formatStorageBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`

  return `${(bytes / 1024).toFixed(1)} KB`
}

function clearSessionStorage(): void {
  if (!window.confirm(t("confirmClearSession"))) return

  clearStorageKeys(
    storageEntries.value
      .filter((entry) => entry.group === "session")
      .map((entry) => entry.key),
  )
  refreshStorage()
}

function clearAllStorage(): void {
  if (!window.confirm(t("confirmClearAllWindbell"))) return

  clearWindbellStorage()
  refreshStorage()
}

const colorModeOptions: Array<{
  value: ColorModePreference
  labelKey: string
}> = [
  { value: "system", labelKey: "colorModeSystem" },
  { value: "light", labelKey: "colorModeLight" },
  { value: "dark", labelKey: "colorModeDark" },
]

const fontOptions: Array<{ value: Font; labelKey: string }> = [
  { value: "unifont", labelKey: "fontUnifont" },
  { value: "source-han-serif", labelKey: "fontSourceHanSerif" },
  { value: "source-han-sans", labelKey: "fontSourceHanSans" },
  { value: "system", labelKey: "fontSystem" },
]

useHead(() => ({
  title: t("title"),
}))
</script>

<template>
  <PageLayout>
    <header class="flex flex-col gap-3">
      <h1 class="text-ink text-xl font-semibold">
        {{ t("title") }}
      </h1>

      <div class="flex flex-wrap items-center gap-2">
        <MediumButton :to="{ name: 'home' }">
          <span>{{ t("app.back") }}</span>
        </MediumButton>

        <MediumButton :to="{ name: 'provider-list' }">
          <span>{{ t("providerList") }}</span>
        </MediumButton>

        <MediumButton :to="{ name: 'theme-list' }">
          <span>{{ t("themes") }}</span>
        </MediumButton>
      </div>
    </header>

    <div class="flex flex-col gap-4">
      <Card as="section">
        <template #tag>
          <h2 class="text-ink">
            {{ t("language") }}
          </h2>
        </template>

        <div class="flex flex-col gap-1 p-2">
          <label
            v-for="item in supportedLocales"
            :key="item.value"
            class="text-ink hover:bg-line flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 transition-colors"
          >
            <input
              class="accent-ink"
              type="radio"
              name="language"
              :value="item.value"
              :checked="locale === item.value"
              @change="setLocale(item.value)"
            />
            <span>{{ item.label }}</span>
          </label>
        </div>
      </Card>

      <Card as="section">
        <template #tag>
          <h2 class="text-ink">
            {{ t("colorMode") }}
          </h2>
        </template>

        <div class="flex flex-col gap-1 p-2">
          <label
            v-for="item in colorModeOptions"
            :key="item.value"
            class="text-ink hover:bg-line flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 transition-colors"
          >
            <input
              class="accent-ink"
              type="radio"
              name="color-mode"
              :value="item.value"
              :checked="colorMode.preference === item.value"
              @change="colorMode.setPreference(item.value)"
            />
            <span>{{ t(item.labelKey) }}</span>
          </label>
        </div>
      </Card>

      <Card as="section">
        <template #tag>
          <h2 class="text-ink">
            {{ t("font") }}
          </h2>
        </template>

        <div class="flex flex-col gap-1 p-2">
          <label
            v-for="item in fontOptions"
            :key="item.value"
            class="text-ink hover:bg-line flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 transition-colors"
          >
            <input
              class="accent-ink"
              type="radio"
              name="font"
              :value="item.value"
              :checked="font.name === item.value"
              @change="font.setFont(item.value)"
            />
            <span>{{ t(item.labelKey) }}</span>
          </label>
        </div>
      </Card>

      <Card as="section">
        <template #tag>
          <h2 class="text-ink">
            {{ t("browserData") }}
          </h2>
        </template>

        <div class="flex flex-col gap-3 p-2">
          <p class="text-ink px-2 text-sm">
            {{ t("browserDataDescription") }}
          </p>

          <p v-if="storageEntries.length === 0" class="text-ink px-2 py-1.5">
            {{ t("storageEmpty") }}
          </p>

          <template v-else>
            <p class="text-ink px-2 text-sm">
              {{
                t("storageSummary", {
                  count: storageEntries.length,
                  size: formatStorageBytes(storageTotalBytes),
                })
              }}
            </p>

            <dl class="flex flex-col gap-1 px-2">
              <div
                v-for="group in storageGroups"
                :key="group.id"
                class="flex items-center justify-between gap-3 text-sm"
              >
                <dt class="text-ink">{{ t(group.labelKey) }}</dt>
                <dd class="text-ink">
                  {{ group.count }} · {{ formatStorageBytes(group.bytes) }}
                </dd>
              </div>
            </dl>

            <details class="px-2">
              <summary
                class="text-ink hover:text-ink cursor-pointer text-sm transition-colors"
              >
                {{ t("showRawStorage") }}
              </summary>

              <ul
                class="border-line/60 mt-2 flex max-h-64 flex-col gap-2 overflow-auto rounded border p-2"
              >
                <li
                  v-for="entry in storageEntries"
                  :key="entry.key"
                  class="flex flex-col gap-1"
                >
                  <code class="text-ink font-mono text-xs break-all">
                    {{ entry.key }}
                  </code>
                  <code class="text-ink font-mono text-xs break-all">
                    {{ entry.value }}
                  </code>
                </li>
              </ul>
            </details>

            <div class="flex flex-wrap items-center gap-2 px-2">
              <MediumButton
                v-if="hasSessionStorage"
                type="button"
                @click="clearSessionStorage"
              >
                {{ t("clearSessionData") }}
              </MediumButton>

              <MediumButton type="button" @click="clearAllStorage">
                {{ t("clearAllWindbellData") }}
              </MediumButton>
            </div>
          </template>
        </div>
      </Card>
    </div>
  </PageLayout>
</template>
