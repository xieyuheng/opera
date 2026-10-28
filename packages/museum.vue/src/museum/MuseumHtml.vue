<script setup lang="ts">
import type { MarkdownEnvironment } from "@xieyuheng/markdown.vue"
import { computed } from "vue"

import { renderMuseumHtml } from "./MuseumHtml.ts"

const props = defineProps<{
  html: string
  documentUrl: string
  environment?: MarkdownEnvironment
}>()

const renderedHtml = computed(() =>
  renderMuseumHtml(props.html, props.documentUrl),
)

function handleClick(event: MouseEvent): void {
  if (event.defaultPrevented) return
  if (event.button !== 0) return
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

  const target = event.target
  if (!(target instanceof Element)) return

  const anchor = target.closest<HTMLAnchorElement>("a[href]")
  if (anchor === null) return
  if (anchor.hasAttribute("download")) return
  if (anchor.getAttribute("target") !== null) return

  const href = anchor.getAttribute("href")
  if (href === null || href.startsWith("#")) return

  props.environment?.handleLinkClick?.(event, anchor.href)
}
</script>

<template>
  <div class="w-full min-w-0" @click="handleClick" v-html="renderedHtml" />
</template>
