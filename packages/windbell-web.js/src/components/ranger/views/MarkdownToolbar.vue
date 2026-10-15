<script setup lang="ts">
import { useI18n } from "vue-i18n"
import MediumButton from "../../buttons/MediumButton.vue"
import { rangerMessages } from "../Ranger.i18n.ts"
import type { MarkdownViewMode } from "./MarkdownViewMode.ts"

const props = defineProps<{
  mode: MarkdownViewMode
}>()

const emit = defineEmits<{
  toggle: []
}>()

const { t } = useI18n({
  messages: rangerMessages,
  useScope: "local",
})
</script>

<template>
  <div class="pointer-events-none flex items-center">
    <MediumButton
      type="button"
      :aria-pressed="props.mode === 'source'"
      :title="props.mode === 'render' ? t('showSource') : t('showRender')"
      @click="emit('toggle')"
    >
      <span>
        {{ props.mode === "render" ? t("showSource") : t("showRender") }}
      </span>
    </MediumButton>
  </div>
</template>
