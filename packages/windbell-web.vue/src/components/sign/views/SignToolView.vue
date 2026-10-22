<script setup lang="ts">
import Markdown from "@xieyuheng/markdown.vue"
import type * as W from "@xieyuheng/windbell.ts/core"
import { computed } from "vue"

import type { SignState } from "../signState.ts"

const props = defineProps<{
  sign: W.ToolSign
  state: SignState
}>()

const parametersText = computed(() =>
  JSON.stringify(props.sign.parameters, null, 2),
)
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="text-ink font-mono">
      {{ sign.name }}
    </div>

    <Markdown :text="sign.description" />

    <pre class="overflow-x-auto font-mono whitespace-pre">{{
      parametersText
    }}</pre>
  </div>
</template>
