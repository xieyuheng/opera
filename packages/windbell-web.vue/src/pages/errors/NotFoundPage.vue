<script setup lang="ts">
import { useHead } from "@unhead/vue"
import { useI18n } from "vue-i18n"

import MediumButton from "../../components/buttons/MediumButton.vue"
import PageLayout from "../../components/layout/PageLayout.vue"
import { notFoundPageMessages } from "./NotFoundPage.i18n.ts"

const { t } = useI18n({
  messages: notFoundPageMessages,
  useScope: "local",
})

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
      <h1 class="text-ink text-xl font-semibold">404</h1>

      <div class="flex flex-wrap items-center gap-2">
        <MediumButton :to="{ name: 'home' }">
          <span>{{ t("app.back") }}</span>
        </MediumButton>
      </div>
    </header>
  </PageLayout>
</template>
