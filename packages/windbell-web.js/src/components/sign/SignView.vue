<script setup lang="ts">
import type * as S from "@windbell/semiosis.js"
import { computed } from "vue"
import type { SignState } from "./signState.ts"
import { resolveSignView } from "./views/registry.ts"

const props = defineProps<{
  sign: S.Sign
  state: SignState
}>()

const view = computed(() => resolveSignView(props.sign))
</script>

<template>
  <component :is="view.component" :sign="sign" :state="state" />
</template>
