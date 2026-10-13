<script setup lang="ts">
import type * as S from "@windbell/semiosis.js"
import { bashToolParameters } from "@windbell/semiosis.js/src/tools/bash/makeBashToolSign.ts"
import { Ajv } from "ajv"
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { signMessages } from "../../Sign.i18n.ts"
import type { SignState } from "../../signState.ts"

const props = defineProps<{
  sign: S.ToolCallSign
  args: unknown
  state: SignState
}>()

type BashArguments = {
  command: string
}

const { t } = useI18n({
  messages: signMessages,
  useScope: "local",
})

const ajv = new Ajv({
  allErrors: true,
  strict: false,
})

const validate = ajv.compile(bashToolParameters)

const bashArgs = computed<BashArguments>(() => {
  if (!validate(props.args)) {
    const message = (validate.errors ?? [])
      .map((error) => `${error.instancePath} ${error.message}`.trim())
      .join("; ")

    throw new Error(`[BashToolCallView] invalid arguments: ${message}`)
  }

  return props.args as BashArguments
})

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // ignore clipboard errors
  }
}

function copyPath(): void {
  const workspaceRoot = props.state.workspaceRoot
  if (workspaceRoot === undefined) return

  void copyText(workspaceRoot)
}

function copyCommand(): void {
  void copyText(bashArgs.value.command)
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="font-mono text-ink">
      {{ sign.name }}
    </div>

    <div class="font-mono break-words">
      <div v-if="state.workspaceRoot">
        <span class="select-none whitespace-pre" aria-hidden="true">{{
          "  "
        }}</span>
        <span class="cursor-pointer" :title="t('copyPath')" @click="copyPath">{{
          state.workspaceRoot
        }}</span>
      </div>

      <div>
        <span class="select-none" aria-hidden="true">$ </span>
        <span
          class="cursor-pointer"
          :title="t('copyCommand')"
          @click="copyCommand"
          >{{ bashArgs.command }}</span
        >
      </div>
    </div>
  </div>
</template>
