<script setup lang="ts">
import type * as S from "@xieyuheng/semiosis.ts/core"

import type { SignState } from "../signState.ts"

defineProps<{
  sign: S.ToolOutputSign
  state: SignState
}>()
</script>

<template>
  <pre class="overflow-x-auto font-mono whitespace-pre">{{ sign.content }}</pre>
</template>
