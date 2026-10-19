<script setup lang="ts">
import { useI18n } from "vue-i18n"

import { providerListMessages } from "./ProviderList.i18n.ts"

defineProps<{
  name: string
  isDefault: boolean
}>()

const { t } = useI18n({
  messages: providerListMessages,
  useScope: "local",
})
</script>

<template>
  <span class="flex min-w-0 flex-wrap items-center justify-between gap-2">
    <code class="text-ink font-mono text-sm break-all">
      {{ name }}
    </code>

    <span
      v-if="isDefault"
      class="bg-line text-ink shrink-0 rounded px-1.5 py-0.5 text-xs"
    >
      {{ t("default") }}
    </span>
  </span>
</template>
