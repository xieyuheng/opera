<script setup lang="ts">
import Markdown from "@windbell/markdown.vue"
import type * as S from "@windbell/semiosis.ts/core"
import { computed } from "vue"

import type { SignState } from "../signState.ts"

const props = defineProps<{
  sign: S.ToolSign
  state: SignState
}>()

const parametersText = computed(() =>
  JSON.stringify(props.sign.parameters, null, 2),
)
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="text-ink font-mono">
      {{ sign.name }}
    </div>

    <Markdown :text="sign.description" />

    <pre class="thin-scrollbar overflow-x-auto font-mono whitespace-pre">{{
      parametersText
    }}</pre>
  </div>
</template>
