<script setup lang="ts">
import type * as S from "@windbell/semiosis.js"
import { computed } from "vue"
import Markdown from "../../markdown/Markdown.vue"
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
    <div class="font-mono text-ink">
      {{ sign.name }}
    </div>

    <Markdown :text="sign.description" />

    <pre class="thin-scrollbar overflow-x-auto whitespace-pre font-mono">{{
      parametersText
    }}</pre>
  </div>
</template>
