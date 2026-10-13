<script setup lang="ts">
import { ArchiveRestore, Trash2 } from "@lucide/vue"
import type * as S from "@windbell/semiosis.js"
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import Card from "../../components/card/Card.vue"
import SmallButton from "../../components/buttons/SmallButton.vue"
import { formatDateTime } from "../../utils/datetime/index.ts"
import SignLine from "../../components/sign/SignLine.vue"
import { sessionDustbinMessages } from "./SessionDustbin.i18n.ts"
import type { SessionDustbinListItem } from "./SessionDustbinState.ts"

const props = withDefaults(
  defineProps<{
    session: SessionDustbinListItem
    busy?: boolean
    previewLimit?: number
  }>(),
  {
    busy: false,
    previewLimit: 5,
  },
)

const emit = defineEmits<{
  restore: []
  remove: []
}>()

const { t } = useI18n({
  messages: sessionDustbinMessages,
  useScope: "local",
})

const previewSigns = computed(() => {
  const signs = props.session.context
  const limit = Math.max(0, props.previewLimit)

  return signs.slice(Math.max(0, signs.length - limit))
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
          <ArchiveRestore :size="16" :stroke-width="1.5" aria-hidden="true" />
          <span>{{ t("restore") }}</span>
        </SmallButton>

        <SmallButton type="button" :disabled="busy" @click="requestRemove">
          <Trash2 :size="16" :stroke-width="1.5" aria-hidden="true" />
          <span>{{ t("remove") }}</span>
        </SmallButton>
      </div>

      <ol v-if="previewSigns.length > 0" class="flex flex-col gap-1">
        <SignLine
          v-for="(sign, index) in previewSigns"
          :key="index"
          :sign="sign"
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
