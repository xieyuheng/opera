import { useData } from "vitepress"
import DefaultTheme from "vitepress/theme"
import { h } from "vue"

import { diaryMeta } from "./diaryMeta"

import "./style.css"

export default {
  extends: DefaultTheme,

  Layout() {
    const { frontmatter, page } = useData()

    return h(DefaultTheme.Layout, null, {
      "doc-before": () => {
        const title = frontmatter.value.title
        const relativePath = page.value.relativePath

        if (typeof title !== "string") return null
        if (!relativePath.includes("/diary/")) return null

        const meta = diaryMeta(frontmatter.value, relativePath)

        return h("header", { class: "windbell-doc-header" }, [
          h("h1", { class: "windbell-doc-title" }, title),
          meta.date || meta.author
            ? h("div", { class: "windbell-doc-meta" }, [
                meta.date
                  ? h("time", { datetime: meta.date }, meta.date)
                  : null,
                meta.date && meta.author ? " · " : null,
                meta.author ? h("span", {}, meta.author) : null,
              ])
            : null,
        ])
      },
    })
  },
}
