<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"

import MediumButton from "../../components/buttons/MediumButton.vue"
import { sessionMessages } from "./Session.i18n.ts"
import type { SignDisplayMode } from "./sessionSignDisplayMode.ts"

const props = defineProps<{
  rangerOpen: boolean
  nextSignDisplayMode: SignDisplayMode
}>()

const emit = defineEmits<{
  back: []
  toggleRanger: []
  cycleSignDisplayMode: []
}>()

const { t } = useI18n({
  messages: sessionMessages,
  useScope: "local",
})

const nextSignDisplayLabel = computed(() => {
  switch (props.nextSignDisplayMode) {
    case "expand":
      return t("signDisplayExpand")
    case "digest":
      return t("signDisplayDigest")
    case "overview":
      return t("signDisplayOverview")
  }
})
</script>

<template>
  <div class="flex flex-col gap-2 sm:flex-row">
    <div class="flex hidden items-center sm:block">
      <MediumButton type="button" @click="emit('back')">
        <span>{{ t("app.back") }}</span>
      </MediumButton>
    </div>

    <MediumButton
      type="button"
      :title="nextSignDisplayLabel"
      @click="emit('cycleSignDisplayMode')"
    >
      <span>{{ nextSignDisplayLabel }}</span>
    </MediumButton>

    <div class="flex items-center">
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
    </div>
  </div>
</template>
