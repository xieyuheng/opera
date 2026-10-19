<script setup lang="ts">
import { useHead } from "@unhead/vue"
import { useI18n } from "vue-i18n"
import { RouterView, useRoute } from "vue-router"
import { useIsDataLoading } from "vue-router/experimental"

import { useColorMode } from "./color-mode.ts"
import { useTheme } from "./theme.ts"

const route = useRoute()
const isDataLoading = useIsDataLoading()
const { locale } = useI18n()
const colorMode = useColorMode()
const { activeTheme } = useTheme()

useHead(() => ({
  htmlAttrs: {
    lang: locale.value,
  },
  meta: [
    {
      name: "theme-color",
      content: activeTheme.value.colors[colorMode.resolved].paper,
    },
  ],
}))
</script>

<template>
  <div
    class="bg-paper text-ink flex min-h-screen flex-col pb-[env(safe-area-inset-bottom,0px)] transition-colors"
  >
    <div
      v-if="isDataLoading"
      class="bg-ink/30 fixed inset-x-0 top-0 z-[100] h-0.5 animate-pulse"
    />

    <RouterView :key="route.fullPath" />
  </div>
</template>
