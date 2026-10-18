<script setup lang="ts">
import { useI18n } from "vue-i18n"
import Card from "../../components/card/Card.vue"
import { sessionMessages } from "./Session.i18n.ts"

defineProps<{
  message: string
  retryable: boolean
  inputPersisted: boolean
}>()

const emit = defineEmits<{
  retry: []
  edit: []
  dismiss: []
}>()

const { t } = useI18n({
  messages: sessionMessages,
  useScope: "local",
})
</script>

<template>
  <Card :color="'var(--color-sign-error)'">
    <template #tag>
      <p class="tracking-wide">{{ t("turnError") }}</p>
    </template>

    <div class="flex flex-col gap-2 px-3 py-2">
      <p class="text-sm text-sign-error">{{ message }}</p>

      <div class="flex flex-wrap gap-2">
        <button
          v-if="retryable"
          type="button"
          class="rounded border border-line/60 px-2 py-1 text-sm text-ink hover:bg-ink/5"
          @click="emit('retry')"
        >
          {{ t("retry") }}
        </button>

        <button
          v-if="!inputPersisted"
          type="button"
          class="rounded border border-line/60 px-2 py-1 text-sm text-ink hover:bg-ink/5"
          @click="emit('edit')"
        >
          {{ t("edit") }}
        </button>

        <button
          type="button"
          class="rounded border border-line/60 px-2 py-1 text-sm text-ink hover:bg-ink/5"
          @click="emit('dismiss')"
        >
          {{ t("dismiss") }}
        </button>
      </div>
    </div>
  </Card>
</template>
