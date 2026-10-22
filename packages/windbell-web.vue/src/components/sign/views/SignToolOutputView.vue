<script setup lang="ts">
import type * as W from "@xieyuheng/windbell.ts/core"

import type { SignState } from "../signState.ts"

defineProps<{
  sign: W.ToolOutputSign
  state: SignState
}>()
</script>

<template>
  <pre class="overflow-x-auto font-mono whitespace-pre">{{ sign.content }}</pre>
</template>
