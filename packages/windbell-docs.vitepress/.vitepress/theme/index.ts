import mediumZoom from "medium-zoom"
import type { Theme } from "vitepress"
import { inBrowser, useRoute } from "vitepress"
import DefaultTheme from "vitepress/theme"
import { nextTick, watch } from "vue"

import "./custom.css"

export default {
  extends: DefaultTheme,

  setup() {
    const route = useRoute()

    watch(
      () => route.path,
      () =>
        nextTick(() => {
          if (inBrowser) {
            mediumZoom("[data-zoomable]", {
              background: "var(--vp-c-bg)",
            })
          }
        }),
      { immediate: true },
    )
  },
} satisfies Theme
