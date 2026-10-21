<script setup lang="ts">
import type { DustbinSessionPreview } from "@windbell/windbell-api.ts/client"
import { useI18n } from "vue-i18n"

import SmallButton from "../../components/buttons/SmallButton.vue"
import Card from "../../components/card/Card.vue"
import SignLine from "../../components/sign/SignLine.vue"
import { formatDateTime } from "../../utils/datetime/index.ts"
import { sessionDustbinMessages } from "./SessionDustbin.i18n.ts"

const props = defineProps<{
  session: DustbinSessionPreview
  busy?: boolean
}>()

const emit = defineEmits<{
  restore: []
  remove: []
}>()

const { t } = useI18n({
  messages: sessionDustbinMessages,
  useScope: "local",
})

function requestRemove(): void {
  if (!window.confirm(t("deleteConfirm"))) return

  emit("remove")
}
</script>

<template>
  <Card as="article">
    <template #tag>
      <h2 class="truncate">
        {{ session.title }}
      </h2>
    </template>

    <div class="flex flex-col gap-2 px-3 py-2">
      <div class="flex items-center gap-2">
        <SmallButton type="button" :disabled="busy" @click="emit('restore')">
          <span>{{ t("restore") }}</span>
        </SmallButton>

        <SmallButton type="button" :disabled="busy" @click="requestRemove">
          <span>{{ t("remove") }}</span>
        </SmallButton>
      </div>

      <ol v-if="session.signPreviews.length > 0" class="flex flex-col gap-1">
        <SignLine
          v-for="(signPreview, index) in session.signPreviews"
          :key="index"
          :sign-preview="signPreview"
        />
      </ol>
    </div>

    <template #footer>
      <div class="flex flex-col gap-1 text-sm">
        <p class="truncate">
          {{ t("deletedAt") }}{{ t("colon")
          }}{{ formatDateTime(session.deletedAt) }}
        </p>
        <p class="truncate">
          {{ t("createdAt") }}{{ t("colon")
          }}{{ formatDateTime(session.createdAt) }}
        </p>
      </div>
    </template>
  </Card>
</template>
