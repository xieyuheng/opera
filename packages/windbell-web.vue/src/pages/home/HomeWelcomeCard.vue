<script setup lang="ts">
import { useI18n } from "vue-i18n"

import MediumButton from "../../components/buttons/MediumButton.vue"
import Card from "../../components/card/Card.vue"
import { homeMessages } from "./Home.i18n.ts"

const emit = defineEmits<{
  create: []
}>()

const { t } = useI18n({
  messages: homeMessages,
  useScope: "local",
})
</script>

<template>
  <Card as="section" class="text-ink">
    <template #tag>
      <h2>{{ t("welcomeTitle") }}</h2>
    </template>

    <div class="flex flex-col gap-4 p-3">
      <p
        class="leading-relaxed whitespace-pre-line"
        v-text="t('welcomeMessage')"
      />

      <div class="flex flex-wrap items-center gap-2">
        <MediumButton type="button" variant="accent" @click="emit('create')">
          <span>{{ t("newWorkspace") }}</span>
        </MediumButton>

        <MediumButton :to="{ name: 'provider-list' }">
          <span>{{ t("configureProvider") }}</span>
        </MediumButton>
      </div>
    </div>
  </Card>
</template>
