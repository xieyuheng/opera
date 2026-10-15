<script setup lang="ts">
import { useI18n } from "vue-i18n"
import type { RouteLocationRaw } from "vue-router"
import MediumButton from "./MediumButton.vue"

defineProps<{
  to: RouteLocationRaw
}>()

const { t } = useI18n()
</script>

<template>
  <MediumButton :to="to">
    <span>{{ t("app.back") }}</span>
  </MediumButton>
</template>
