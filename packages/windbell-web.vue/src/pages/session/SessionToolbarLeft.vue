<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"

import MediumButton from "../../components/buttons/MediumButton.vue"
import { sessionMessages } from "./Session.i18n.ts"
import type { SessionState } from "./SessionState.ts"
import SessionTurnButton from "./SessionTurnButton.vue"
import SessionUsageBar from "./SessionUsageBar.vue"
import SessionUsageButton from "./SessionUsageButton.vue"

const props = defineProps<{
  state: SessionState
}>()

const emit = defineEmits<{
  selectTurn: [turnIndex: number]
}>()

const { t } = useI18n({
  messages: sessionMessages,
  useScope: "local",
})

const userSummaries = computed(() => {
  const summaries: Array<string> = []

  for (const sign of props.state.context) {
    if (sign.kind === "UserSign") {
      summaries.push(sign.content)
    }
  }

  const activeTurn = props.state.activeTurn
  if (
    activeTurn !== undefined &&
    summaries.length < props.state.turnDetails.length
  ) {
    summaries.push(activeTurn.input)
  }

  return summaries
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
      <SessionUsageButton
        v-if="props.state.totalUsage !== undefined"
        :total-usage="props.state.totalUsage"
      />

      <SessionTurnButton
        v-if="props.state.hasLoaded"
        :turns="props.state.turnDetails"
        :user-summaries="userSummaries"
        @select-turn="emit('selectTurn', $event)"
      />
    </div>
  </div>
</template>
