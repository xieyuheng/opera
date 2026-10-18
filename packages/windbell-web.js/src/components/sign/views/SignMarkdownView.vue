<script setup lang="ts">
import type * as S from "@windbell/semiosis.js/core"
import Markdown from "../../markdown/Markdown.vue"
import type { SignState } from "../signState.ts"

defineProps<{
  sign: S.PersonaSign | S.UserSign | S.ReasoningSign | S.AssistantSign
  state: SignState
}>()
</script>

<template>
  <pre
    v-if="state.streaming"
    class="font-mono whitespace-pre-wrap break-words"
    >{{ sign.content }}</pre>

  <Markdown v-else :text="sign.content" />
</template>
