<script setup lang="ts">
import type * as S from "@windbell/semiosis.ts/core"

import type { SignState } from "../signState.ts"

defineProps<{
  sign: S.Sign
  state: SignState
}>()
</script>

<template>
  <pre class="overflow-x-auto font-mono whitespace-pre-wrap">{{
    JSON.stringify(sign, null, 2)
  }}</pre>
</template>
