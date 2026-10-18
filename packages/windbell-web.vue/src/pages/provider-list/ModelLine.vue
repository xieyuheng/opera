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
    <code class="break-all font-mono text-sm text-ink">
      {{ name }}
    </code>

    <span
      v-if="isDefault"
      class="shrink-0 rounded bg-line px-1.5 py-0.5 text-xs text-ink"
    >
      {{ t("default") }}
    </span>
  </span>
</template>
