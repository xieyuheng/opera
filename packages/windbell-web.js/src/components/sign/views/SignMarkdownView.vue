<script setup lang="ts">
import type * as S from "@windbell/semiosis.js"
import Markdown from "../../markdown/Markdown.vue"
import type { SignState } from "../signState.ts"

defineProps<{
  sign: S.PersonaSign | S.UserSign | S.ReasoningSign | S.AssistantSign
  state: SignState
}>()
</script>

<template>
  <Markdown :text="sign.content" />
</template>
