<script setup lang="ts">
import type * as W from "@xieyuheng/windbell.ts/core"
import { computed } from "vue"
import { useI18n } from "vue-i18n"

import { signMessages } from "./Sign.i18n.ts"
import { resolveSignView } from "./views/registry.ts"

const props = defineProps<{
  signPreview: W.SignPreview
}>()

const emit = defineEmits<{
  "line-click": []
  "tag-click": []
}>()

const { t } = useI18n({
  messages: signMessages,
  useScope: "local",
})

const view = computed(() => resolveSignView(props.signPreview))
</script>

<template>
  <div class="flex min-w-0 items-center gap-2">
    <button
      type="button"
      class="text-ink shrink-0 cursor-pointer rounded px-1.5 py-px"
      :style="{ backgroundColor: view.color }"
      @click.stop="emit('tag-click')"
    >
      {{ t(view.labelKey) }}
    </button>

    <span
      class="cursor-pointer truncate"
      :title="signPreview.truncatedContent"
      @click="emit('line-click')"
    >
      {{ signPreview.truncatedContent }}
    </span>
  </div>
</template>
