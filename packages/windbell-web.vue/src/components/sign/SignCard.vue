<script setup lang="ts">
import type * as S from "@xieyuheng/semiosis.ts/core"
import { computed } from "vue"
import { useI18n } from "vue-i18n"

import Card from "../card/Card.vue"
import { signMessages } from "./Sign.i18n.ts"
import { createSignState } from "./signState.ts"
import SignView from "./SignView.vue"
import { resolveSignView } from "./views/registry.ts"

const props = defineProps<{
  sign: S.Sign
  workspaceRoot?: string
  streaming?: boolean
}>()

const emit = defineEmits<{
  "tag-click": []
}>()

const { t } = useI18n({
  messages: signMessages,
  useScope: "local",
})

const view = computed(() => resolveSignView(props.sign))
const state = computed(() =>
  createSignState({
    workspaceRoot: props.workspaceRoot,
    streaming: props.streaming,
  }),
)
</script>

<template>
  <Card :color="view.color">
    <template #tag>
      <button
        type="button"
        class="cursor-pointer tracking-wide"
        @click.stop="emit('tag-click')"
      >
        {{ t(view.labelKey) }}
      </button>
    </template>

    <div class="px-3 py-2">
      <SignView :sign="sign" :state="state" />
    </div>
  </Card>
</template>
