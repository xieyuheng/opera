<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { RouterLink } from "vue-router"

import SmallButton from "../../components/buttons/SmallButton.vue"
import Card from "../../components/card/Card.vue"
import ModelLine from "./ModelLine.vue"
import { providerListMessages } from "./ProviderList.i18n.ts"
import type { ProviderSummary } from "./ProviderListState.ts"

const props = defineProps<{
  provider: ProviderSummary
}>()

const emit = defineEmits<{
  setDefault: []
  putApiKey: [key: string]
  deleteApiKey: []
}>()

const { t } = useI18n({
  messages: providerListMessages,
  useScope: "local",
})

const pinnedModels = computed(() =>
  props.provider.models.filter((model) => model.pinned),
)

const providerRoute = computed(() => ({
  name: "provider",
  params: {
    providerName: props.provider.name,
  },
}))

function requestSetDefault(): void {
  if (props.provider.isDefaultProvider) return

  emit("setDefault")
}

function requestPutApiKey(): void {
  const key = window.prompt(t("apiKeyPrompt"), "")
  if (key === null) return

  const value = key.trim()
  if (value === "") return

  emit("putApiKey", value)
}

function requestDeleteApiKey(): void {
  if (!window.confirm(t("deleteApiKeyConfirm"))) return

  emit("deleteApiKey")
}
</script>

<template>
  <Card as="article">
    <template #tag>
      <RouterLink class="block min-w-0" :to="providerRoute">
        <h2 class="truncate">
          {{ provider.name }}
        </h2>
      </RouterLink>
    </template>

    <div class="flex flex-col gap-2 px-3 py-2">
      <RouterLink class="block min-w-0" :to="providerRoute">
        <p class="truncate font-mono text-sm" :title="provider.baseUrl">
          {{ provider.baseUrl }}
        </p>
      </RouterLink>

      <div class="flex flex-wrap items-center gap-2">
        <SmallButton
          type="button"
          :disabled="provider.isDefaultProvider"
          @click="requestSetDefault"
        >
          <span>
            {{
              provider.isDefaultProvider
                ? t("defaultProvider")
                : t("setAsDefault")
            }}
          </span>
        </SmallButton>

        <template v-if="provider.apiKeyConfigured">
          <SmallButton type="button" @click="requestPutApiKey">
            <span>{{ t("updateApiKey") }}</span>
          </SmallButton>

          <SmallButton type="button" @click="requestDeleteApiKey">
            <span>{{ t("deleteApiKey") }}</span>
          </SmallButton>
        </template>

        <SmallButton v-else type="button" @click="requestPutApiKey">
          <span>{{ t("configureApiKey") }}</span>
        </SmallButton>
      </div>

      <section class="flex flex-col gap-2">
        <h3 class="text-ink text-base font-semibold">
          {{ t("models") }}
        </h3>

        <p v-if="pinnedModels.length === 0" class="text-ink text-sm">
          {{ t("noModels") }}
        </p>

        <ul v-else class="flex flex-col gap-1">
          <li
            v-for="model in pinnedModels"
            :key="model.name"
            class="bg-line rounded px-2 py-1.5"
          >
            <RouterLink class="block" :to="providerRoute">
              <ModelLine :name="model.name" :is-default="model.isDefault" />
            </RouterLink>
          </li>
        </ul>
      </section>
    </div>
  </Card>
</template>
