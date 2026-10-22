<script setup lang="ts">
import type * as W from "@xieyuheng/windbell.ts/core"

import type { SignState } from "../signState.ts"

defineProps<{
  sign: W.Sign
  state: SignState
}>()
</script>

<template>
  <pre class="overflow-x-auto font-mono whitespace-pre-wrap">{{
    JSON.stringify(sign, null, 2)
  }}</pre>
</template>
