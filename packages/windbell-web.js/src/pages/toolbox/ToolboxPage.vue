<script setup lang="ts">
import { useHead } from "@unhead/vue"
import { ref } from "vue"
import { useI18n } from "vue-i18n"
import { useRouter } from "vue-router"
import BackButton from "../../components/buttons/BackButton.vue"
import MediumButton from "../../components/buttons/MediumButton.vue"
import PageLayout from "../../components/layout/PageLayout.vue"
import {
  encodeMarkdownSource,
  markdownSourceQueryKey,
} from "../markdown/markdownSource.ts"
import { toolboxMessages } from "./Toolbox.i18n.ts"

type ToolItem = {
  id: string
  labelKey: string
  action: () => void
}

type ToolCategory = {
  id: string
  labelKey: string
  tools: Array<ToolItem>
}

const { t } = useI18n({
  messages: toolboxMessages,
  useScope: "local",
})
const router = useRouter()

const markdownInput = ref<HTMLInputElement>()
const error = ref<string | undefined>(undefined)

function openMarkdownFilePicker(): void {
  markdownInput.value?.click()
}

async function handleMarkdownFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file === undefined) return

  try {
    error.value = undefined
    const source = await file.text()
    await router.push({
      name: "markdown",
      query: {
        [markdownSourceQueryKey]: encodeMarkdownSource(source),
      },
    })
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : String(caught)
  } finally {
    input.value = ""
  }
}

const toolCategories: Array<ToolCategory> = [
  {
    id: "preview",
    labelKey: "previewTools",
    tools: [
      {
        id: "markdown-preview",
        labelKey: "markdownPreview",
        action: openMarkdownFilePicker,
      },
    ],
  },
]

useHead(() => ({
  title: t("title"),
  meta: [
    {
      name: "description",
      content: t("description"),
    },
  ],
}))
</script>

<template>
  <PageLayout>
    <header class="flex flex-col gap-3">
      <h1 class="text-xl text-ink">
        {{ t("title") }}
      </h1>

      <div class="flex flex-wrap items-center gap-2">
        <BackButton :to="{ name: 'home' }" />
      </div>
    </header>

    <p v-if="error" class="text-sign-error">
      {{ error }}
    </p>

    <input
      ref="markdownInput"
      class="hidden"
      type="file"
      accept=".md,.markdown,.txt,text/markdown"
      @change="handleMarkdownFileChange"
    />

    <section
      v-for="category in toolCategories"
      :key="category.id"
      class="flex flex-col gap-2"
    >
      <h2 class="text-base text-ink">
        {{ t(category.labelKey) }}
      </h2>

      <div class="flex flex-wrap items-center gap-2">
        <MediumButton
          v-for="tool in category.tools"
          :key="tool.id"
          type="button"
          @click="tool.action"
        >
          <span>{{ t(tool.labelKey) }}</span>
        </MediumButton>
      </div>
    </section>
  </PageLayout>
</template>
