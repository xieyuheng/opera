<script setup lang="ts">
import { useI18n } from "vue-i18n"

import { rangerMessages } from "../Ranger.i18n.ts"
import type { RangerEmptyContent } from "../RangerContent.ts"

defineProps<{
  content: RangerEmptyContent
}>()

const { t } = useI18n({
  messages: rangerMessages,
  useScope: "local",
})
</script>

<template>
  <div class="text-ink flex h-full items-center justify-center px-4">
    {{ t("unknown") }}
  </div>
</template>
