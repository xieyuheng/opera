<script setup lang="ts">
import { useI18n } from "vue-i18n"

import SmallButton from "../../components/buttons/SmallButton.vue"
import ToggleSwitch from "../../components/toggle/ToggleSwitch.vue"
import { providerMessages } from "./Provider.i18n.ts"

const props = defineProps<{
  pinned: boolean
  isDefault: boolean
  busy: boolean
}>()

const emit = defineEmits<{
  pin: []
  unpin: []
  setDefault: []
}>()

const { t } = useI18n({
  messages: providerMessages,
  useScope: "local",
})

function requestTogglePinned(nextPinned: boolean): void {
  if (props.busy || nextPinned === props.pinned) return

  if (nextPinned) {
    emit("pin")
  } else {
    emit("unpin")
  }
}

function requestSetDefault(): void {
  if (props.isDefault) return

  emit("setDefault")
}
</script>

<template>
  <div class="flex min-h-9 flex-wrap items-center gap-3">
    <ToggleSwitch
      :model-value="props.pinned"
      :disabled="props.busy"
      @update:model-value="requestTogglePinned"
    >
      <span class="text-sm">{{ t("pinModel") }}</span>
    </ToggleSwitch>

    <SmallButton
      type="button"
      :disabled="props.busy || props.isDefault"
      @click="requestSetDefault"
    >
      <span>
        {{ props.isDefault ? t("defaultModel") : t("setAsDefaultModel") }}
      </span>
    </SmallButton>
  </div>
</template>
