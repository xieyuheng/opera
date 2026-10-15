<script setup lang="ts">
import { useI18n } from "vue-i18n"
import MediumButton from "../../components/buttons/MediumButton.vue"
import { sessionMessages } from "./Session.i18n.ts"

const props = defineProps<{
  rangerOpen: boolean
}>()

const emit = defineEmits<{
  toggleRanger: []
}>()

const { t } = useI18n({
  messages: sessionMessages,
  useScope: "local",
})
</script>

<template>
  <MediumButton
    type="button"
    :active="props.rangerOpen"
    :aria-pressed="props.rangerOpen"
    :title="props.rangerOpen ? t('closeRanger') : t('openRanger')"
    @click="emit('toggleRanger')"
  >
    <span>
      {{ props.rangerOpen ? t("closeRanger") : t("openRanger") }}
    </span>
  </MediumButton>
</template>
