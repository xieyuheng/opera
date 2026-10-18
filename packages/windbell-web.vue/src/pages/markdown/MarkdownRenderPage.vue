<script setup lang="ts">
import { computed } from "vue"
import { useRoute } from "vue-router"
import Markdown from "../../components/markdown/Markdown.vue"
import {
  markdownSourceFromQuery,
  markdownSourceQueryKey,
} from "./markdownSource.ts"

const route = useRoute()

const source = computed(() =>
  markdownSourceFromQuery(route.query[markdownSourceQueryKey]),
)
</script>

<template>
  <main class="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-4">
    <Markdown v-if="source !== undefined" :text="source" />
  </main>
</template>
