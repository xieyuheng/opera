<script setup lang="ts">
import Markdown from "@windbell/markdown.vue"
import type * as S from "@windbell/semiosis.ts/core"

import type { SignState } from "../signState.ts"

defineProps<{
  sign: S.PersonaSign | S.UserSign | S.ReasoningSign | S.AssistantSign
  state: SignState
}>()
</script>

<template>
  <pre
    v-if="state.streaming"
    class="font-mono break-words whitespace-pre-wrap"
    >{{ sign.content }}</pre>

  <Markdown v-else :text="sign.content" />
</template>
