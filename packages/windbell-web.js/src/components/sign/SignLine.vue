<script setup lang="ts">
import type * as S from "@windbell/semiosis.js/core"
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { signMessages } from "./Sign.i18n.ts"
import { signBody } from "./signBody.ts"
import { resolveSignView } from "./views/registry.ts"

const props = defineProps<{
  sign: S.Sign
}>()

const emit = defineEmits<{
  "tag-click": []
}>()

const { t } = useI18n({
  messages: signMessages,
  useScope: "local",
})

const view = computed(() => resolveSignView(props.sign))
</script>

<template>
  <div class="flex min-w-0 items-center gap-2">
    <button
      type="button"
      class="shrink-0 cursor-pointer rounded px-1.5 py-px text-ink"
      :style="{ backgroundColor: view.color }"
      @click.stop="emit('tag-click')"
    >
      {{ t(view.labelKey) }}
    </button>

    <span class="truncate">
      {{ signBody(sign) }}
    </span>
  </div>
</template>
