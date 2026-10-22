<script setup lang="ts">
import type * as S from "@windbell/semiosis.ts/core"

import type { SignState } from "../signState.ts"

defineProps<{
  sign: S.ProviderDataSign
  state: SignState
}>()
</script>

<template>
  <pre class="overflow-x-auto font-mono whitespace-pre-wrap">{{
    JSON.stringify(sign.data, null, 2)
  }}</pre>
</template>
