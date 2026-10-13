<script setup lang="ts">
import type * as S from "@windbell/semiosis.js"
import { computed } from "vue"
import type { SignState } from "../../signState.ts"

const props = defineProps<{
  sign: S.ToolCallSign
  args: unknown
  state: SignState
}>()

const argumentsText = computed(() => JSON.stringify(props.args, null, 2) ?? "")
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="font-mono text-ink">
      {{ sign.name }}
    </div>

    <pre class="thin-scrollbar overflow-x-auto whitespace-pre font-mono">{{
      argumentsText
    }}</pre>
  </div>
</template>
