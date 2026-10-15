<script setup lang="ts">
import { useI18n } from "vue-i18n"
import MediumButton from "../../components/buttons/MediumButton.vue"
import SessionUsageBar from "./SessionUsageBar.vue"
import SessionUsageButton from "./SessionUsageButton.vue"
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
      v-if="props.state.contextWindow !== undefined"
      :usage="props.state.latestUsage"
      :context-window="props.state.contextWindow"
    />

    <div class="flex items-center gap-2">
      <MediumButton type="button" @click="emit('back')">
        <span>{{ t("app.back") }}</span>
      </MediumButton>

      <SessionUsageButton
        v-if="props.state.totalUsage !== undefined"
        :total-usage="props.state.totalUsage"
      />
    </div>
  </div>
</template>
