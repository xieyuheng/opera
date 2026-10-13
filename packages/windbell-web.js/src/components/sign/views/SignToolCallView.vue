<script setup lang="ts">
import type * as S from "@windbell/semiosis.js"
import { computed } from "vue"
import type { SignState } from "../signState.ts"
import { parseToolCallArguments } from "./tool-calls/parseToolCallArguments.ts"
import { resolveToolCallView } from "./tool-calls/registry.ts"

const props = defineProps<{
  sign: S.ToolCallSign
  state: SignState
}>()

const component = computed(() => resolveToolCallView(props.sign))
const args = computed(() => parseToolCallArguments(props.sign))
</script>

<template>
  <component :is="component" :sign="sign" :args="args" :state="state" />
</template>
