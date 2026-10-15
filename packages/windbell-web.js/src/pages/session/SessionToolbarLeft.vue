<script setup lang="ts">
import { useI18n } from "vue-i18n"
import MediumButton from "../../components/buttons/MediumButton.vue"
import SessionUsageBar from "./SessionUsageBar.vue"
import { sessionMessages } from "./Session.i18n.ts"
import type { SessionState } from "./SessionState.ts"

const props = defineProps<{
  state: SessionState
}>()

const emit = defineEmits<{
  back: []
}>()

const { t } = useI18n({
  messages: sessionMessages,
  useScope: "local",
})
</script>

<template>
  <div class="flex flex-col gap-2">
    <SessionUsageBar
      :usage="props.state.latestUsage"
      :context-window="props.state.contextWindow"
    />

    <MediumButton class="self-start" type="button" @click="emit('back')">
      <span>{{ t("app.back") }}</span>
    </MediumButton>
  </div>
</template>
