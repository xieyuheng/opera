<script setup lang="ts">
import { useI18n } from "vue-i18n"
import MediumButton from "../../components/buttons/MediumButton.vue"
import { sessionMessages } from "./Session.i18n.ts"
import type { SessionState } from "./SessionState.ts"

const props = defineProps<{
  state: SessionState
  rangerOpen: boolean
}>()

const emit = defineEmits<{
  back: []
  toggleRanger: []
}>()

const { t } = useI18n({
  messages: sessionMessages,
  useScope: "local",
})
</script>

<template>
  <div class="pointer-events-none flex items-center justify-between px-2">
    <MediumButton type="button" @click="emit('back')">
      <span>{{ t("app.back") }}</span>
    </MediumButton>

    <MediumButton
      type="button"
      :aria-pressed="rangerOpen"
      :disabled="props.state.workspaceId === ''"
      :title="rangerOpen ? t('closeRanger') : t('openRanger')"
      @click="emit('toggleRanger')"
    >
      <span>
        {{ rangerOpen ? t("closeRanger") : t("openRanger") }}
      </span>
    </MediumButton>
  </div>
</template>
