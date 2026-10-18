<script setup lang="ts">
import { useHead } from "@unhead/vue"
import { useI18n } from "vue-i18n"
import MediumButton from "../../components/buttons/MediumButton.vue"
import PageLayout from "../../components/layout/PageLayout.vue"
import ProviderCard from "./ProviderCard.vue"
import { providerListMessages } from "./ProviderList.i18n.ts"
import {
  getProviderListState,
  deleteProviderApiKey,
  putProviderApiKey,
  selectDefaultProvider,
} from "./ProviderListState.ts"

const { t } = useI18n({
  messages: providerListMessages,
  useScope: "local",
})

const state = getProviderListState()

async function handleSetDefaultProvider(providerName: string): Promise<void> {
  try {
    await selectDefaultProvider(state, providerName)
  } catch (error) {
    state.error = error instanceof Error ? error.message : String(error)
  }
}

async function handlePutApiKey(
  providerName: string,
  key: string,
): Promise<void> {
  try {
    await putProviderApiKey(state, providerName, key)
  } catch (error) {
    state.error = error instanceof Error ? error.message : String(error)
  }
}

async function handleDeleteApiKey(providerName: string): Promise<void> {
  try {
    await deleteProviderApiKey(state, providerName)
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
      <h1 class="text-xl text-ink">
        {{ t("title") }}
      </h1>

      <div class="flex flex-wrap items-center gap-2">
        <MediumButton :to="{ name: 'settings' }">
          <span>{{ t("app.back") }}</span>
        </MediumButton>
      </div>
    </header>

    <div class="flex flex-col gap-2">
      <h2 class="text-base text-ink">
        {{ t("providers") }}
      </h2>
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
      v-else
      class="flex flex-col gap-4"
      :class="{ 'opacity-60': state.isPending }"
      :aria-busy="state.isPending"
    >
      <li v-for="provider in state.providers" :key="provider.name">
        <ProviderCard
          :provider="provider"
          @set-default="handleSetDefaultProvider(provider.name)"
          @put-api-key="handlePutApiKey(provider.name, $event)"
          @delete-api-key="handleDeleteApiKey(provider.name)"
        />
      </li>
    </ul>
  </PageLayout>
</template>
