<script setup lang="ts">
import type { OpenRouterProviderModelEntry } from "@windbell/semiosis.js"
import Card from "../../components/card/Card.vue"
import ModelCardToolbar from "./ModelCardToolbar.vue"
import { useI18n } from "vue-i18n"
import { providerMessages } from "./Provider.i18n.ts"

const props = defineProps<{
  entry: OpenRouterProviderModelEntry
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

function json(value: unknown): string {
  return JSON.stringify(value, null, 2)
}
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
            <dt class="text-ink">{{ t("contextLength") }}{{ t("colon") }}</dt>
            <dd class="font-mono text-ink">
              {{ entry.info.context_length }}
            </dd>
          </div>

          <div class="flex flex-wrap">
            <dt class="text-ink">{{ t("modality") }}{{ t("colon") }}</dt>
            <dd class="font-mono text-ink">
              {{ entry.info.architecture.modality ?? t("none") }}
            </dd>
          </div>

          <div class="flex flex-wrap">
            <dt class="text-ink">{{ t("inputModalities") }}{{ t("colon") }}</dt>
            <dd class="font-mono text-ink">
              {{ entry.info.architecture.input_modalities.join(", ") }}
            </dd>
          </div>

          <div class="flex flex-wrap">
            <dt class="text-ink">
              {{ t("outputModalities") }}{{ t("colon") }}
            </dt>
            <dd class="font-mono text-ink">
              {{ entry.info.architecture.output_modalities.join(", ") }}
            </dd>
          </div>

          <div class="flex">
            <dt class="shrink-0 text-ink">
              {{ t("supportedParameters") }}{{ t("colon") }}
            </dt>
            <dd
              v-if="entry.info.supported_parameters.length > 0"
              class="min-w-0 flex-1 break-words font-mono text-ink"
            >
              {{ entry.info.supported_parameters.join(", ") }}
            </dd>
            <dd v-else class="font-mono text-ink">{{ t("none") }}</dd>
          </div>
        </dl>
      </section>
    </div>

    <template #footer v-if="entry.config">
      <section class="flex flex-col gap-1 text-sm">
        <dl class="flex flex-col gap-1">
          <div class="flex flex-wrap">
            <dt class="text-ink">{{ t("reasoning") }}{{ t("colon") }}</dt>
            <dd>
              <pre class="overflow-auto font-mono">{{
                entry.config.reasoning
                  ? json(entry.config.reasoning)
                  : t("none")
              }}</pre>
            </dd>
          </div>

          <div class="flex flex-wrap">
            <dt class="text-ink">{{ t("provider") }}{{ t("colon") }}</dt>
            <dd>
              <pre class="overflow-auto font-mono">{{
                entry.config.provider ? json(entry.config.provider) : t("none")
              }}</pre>
            </dd>
          </div>

          <div class="flex flex-wrap">
            <dt class="text-ink">{{ t("extraBody") }}{{ t("colon") }}</dt>
            <dd>
              <pre class="overflow-auto font-mono">{{
                entry.config.extraBody
                  ? json(entry.config.extraBody)
                  : t("none")
              }}</pre>
            </dd>
          </div>
        </dl>
      </section>
    </template>
  </Card>
</template>
