<script setup lang="ts">
import Markdown, {
  findFrontmatterNode,
  parseFrontmatter,
  parseMarkdown,
  readFrontmatterString,
  safeUrl,
} from "@xieyuheng/markdown.vue"
import { computed, watch } from "vue"

import { readMuseumCoverImage } from "./MuseumCoverImage.ts"
import MuseumNav from "./MuseumNav.vue"
import {
  isMuseumPageMissing,
  loadMuseumCuration,
  loadMuseumDocument,
  makeMuseumMarkdownEnvironment,
  makeMuseumState,
  museumNavColumns,
  setMuseumContentBaseUrl,
  setMuseumName,
} from "./MuseumState.ts"

const props = defineProps<{
  contentBaseUrl: string
  name?: string
  makeHref?: (name: string) => string
}>()

const emit = defineEmits<{
  navigate: [name: string]
}>()

const state = makeMuseumState(props.contentBaseUrl, props.name)

let rootNavigationRequested = false

const navColumns = computed(() => museumNavColumns(state))

const markdownEnvironment = computed(() =>
  makeMuseumMarkdownEnvironment(state, (name) => emit("navigate", name)),
)

const missingPage = computed(() => isMuseumPageMissing(state))

const frontmatter = computed(() => {
  if (state.documentKind !== "markdown" || state.documentText === "") {
    return undefined
  }

  return parseFrontmatter(
    findFrontmatterNode(parseMarkdown(state.documentText)),
  )
})

const coverImage = computed(() => {
  const image = readMuseumCoverImage(frontmatter.value)
  if (image === undefined) return undefined

  const rawSrc = safeUrl(image.src, { image: true })
  if (rawSrc === undefined) return undefined

  return {
    ...image,
    src:
      markdownEnvironment.value?.resolveUrl?.(rawSrc, { kind: "image" }) ??
      rawSrc,
    alt: image.alt ?? readFrontmatterString(frontmatter.value, "title"),
  }
})

function requestRootNavigation(): void {
  if (state.curation === undefined || rootNavigationRequested) return

  rootNavigationRequested = true
  emit("navigate", state.curation.root.name)
}

async function loadCurationAndPage(): Promise<void> {
  rootNavigationRequested = false

  setMuseumContentBaseUrl(state, props.contentBaseUrl)
  setMuseumName(state, props.name)

  await loadMuseumCuration(state)

  if (state.curation === undefined) return
  if (state.name === undefined) {
    requestRootNavigation()
    return
  }

  await loadMuseumDocument(state)
}

watch(
  () => props.contentBaseUrl,
  () => void loadCurationAndPage(),
  { immediate: true },
)

watch(
  () => props.name,
  async (name) => {
    setMuseumName(state, name)

    if (state.curation === undefined) return
    if (name === undefined) {
      requestRootNavigation()
      return
    }

    rootNavigationRequested = false
    await loadMuseumDocument(state)
  },
)
</script>

<template>
  <div class="flex flex-col items-start gap-6">
    <header
      class="flex w-full max-w-[45rem] flex-col items-start gap-8 px-3 pt-3 sm:flex-row sm:px-8 sm:pt-8"
    >
      <h1 @click.prevent="emit('navigate', state.curation?.root.name || '')">
        <slot name="logo" />
      </h1>

      <MuseumNav
        v-if="state.currentNode"
        :current="state.currentNode"
        :columns="navColumns"
        :make-href="props.makeHref"
        @navigate="emit('navigate', $event)"
      />
    </header>

    <figure
      v-if="coverImage"
      class="m-0 w-full max-w-[48rem] p-0"
      :style="
        coverImage.maxWidth === undefined
          ? undefined
          : { maxWidth: coverImage.maxWidth }
      "
    >
      <img
        :src="coverImage.src"
        :alt="coverImage.alt"
        class="block h-auto w-full"
        loading="eager"
        decoding="async"
      />
    </figure>

    <main class="w-full max-w-[45rem] px-3 pb-3 sm:px-8 sm:pb-8">
      <p v-if="state.isCurationLoading">正在读取 curation…</p>

      <p v-else-if="state.curationError">
        {{ state.curationError }}
      </p>

      <template v-else-if="state.curation">
        <div v-if="missingPage">
          <p>curation 中没有这个页面。</p>
          <a
            :href="
              props.makeHref?.(state.curation.root.name) ??
              `/${encodeURIComponent(state.curation.root.name)}`
            "
            @click.prevent="emit('navigate', state.curation.root.name)"
          >
            回到 {{ state.curation.root.name }}
          </a>
        </div>

        <p v-else-if="state.isDocumentLoading">正在读取页面…</p>

        <p v-else-if="state.documentError">
          {{ state.documentError }}
        </p>

        <Markdown
          v-else-if="state.documentUrl && state.documentKind === 'markdown'"
          :text="state.documentText"
          :environment="markdownEnvironment"
        />

        <p v-else-if="state.documentUrl">暂不支持这种文件类型。</p>
      </template>
    </main>
  </div>
</template>

<style>
a:hover {
  background-color: var(--color-ink);
  color: var(--color-paper);
}
</style>
