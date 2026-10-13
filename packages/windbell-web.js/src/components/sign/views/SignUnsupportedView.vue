<script setup lang="ts">
import type * as S from "@windbell/semiosis.js"
import type { SignState } from "../signState.ts"

defineProps<{
  sign: S.Sign
  state: SignState
}>()
</script>

<template>
  <pre class="thin-scrollbar overflow-x-auto whitespace-pre-wrap font-mono">{{
    JSON.stringify(sign, null, 2)
  }}</pre>
</template>
