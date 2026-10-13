<script setup lang="ts">
import type { DeepSeekProviderModelEntry } from "@windbell/semiosis.js"
import Card from "../../components/card/Card.vue"
import ModelCardToolbar from "./ModelCardToolbar.vue"
import { useI18n } from "vue-i18n"
import { providerMessages } from "./Provider.i18n.ts"

defineProps<{
  entry: DeepSeekProviderModelEntry
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
</script>

<template>
  <Card as="article">
    <template #tag>
      <h2 class="break-all font-mono text-sm text-ink">
        {{ entry.name }}
      </h2>
    </template>

    <div class="flex flex-col gap-2 p-2">
      <ModelCardToolbar
        :pinned="entry.pinned"
        :is-default="entry.isDefault"
        :busy="busy"
        @pin="emit('pin')"
        @unpin="emit('unpin')"
        @set-default="emit('setDefault')"
      />

      <section v-if="entry.info" class="flex flex-col gap-1 text-sm">
        <dl class="flex flex-col gap-1">
          <div class="flex flex-wrap">
            <dt class="text-ink">{{ t("ownedBy") }}{{ t("colon") }}</dt>
            <dd class="font-mono text-ink">{{ entry.info.owned_by }}</dd>
          </div>

          <div class="flex flex-wrap">
            <dt class="text-ink">{{ t("contextWindow") }}{{ t("colon") }}</dt>
            <dd class="font-mono text-ink">{{ entry.info.context_window }}</dd>
          </div>

          <div class="flex flex-wrap">
            <dt class="text-ink">{{ t("maxOutputTokens") }}{{ t("colon") }}</dt>
            <dd class="font-mono text-ink">
              {{ entry.info.max_output_tokens }}
            </dd>
          </div>

          <div class="flex flex-wrap">
            <dt class="text-ink">{{ t("inputModalities") }}{{ t("colon") }}</dt>
            <dd class="font-mono text-ink">
              {{ entry.info.input_modalities.join(", ") }}
            </dd>
          </div>

          <div class="flex flex-wrap">
            <dt class="text-ink">
              {{ t("outputModalities") }}{{ t("colon") }}
            </dt>
            <dd class="font-mono text-ink">
              {{ entry.info.output_modalities.join(", ") }}
            </dd>
          </div>
        </dl>
      </section>
    </div>

    <template #footer v-if="entry.config">
      <section class="flex flex-col gap-1 text-sm">
        <dl class="flex flex-col gap-1">
          <div class="flex flex-wrap">
            <dt class="text-ink">{{ t("thinking") }}{{ t("colon") }}</dt>
            <dd class="font-mono text-ink">{{ entry.config.thinking }}</dd>
          </div>

          <div class="flex flex-wrap">
            <dt class="text-ink">{{ t("reasoningEffort") }}{{ t("colon") }}</dt>
            <dd class="font-mono text-ink">
              {{ entry.config.reasoningEffort }}
            </dd>
          </div>
        </dl>
      </section>
    </template>
  </Card>
</template>
