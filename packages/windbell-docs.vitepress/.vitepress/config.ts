import { createRequire } from "node:module"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vitepress"
import { demoteDiaryHeadings } from "./markdown/demote-diary-headings"
import { markdownSidebar } from "./sidebar"

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, "../../..")
const docsDir = resolve(repoRoot, "docs")
const diaryDir = resolve(docsDir, "diary")
const repository = "https://github.com/xieyuheng/windbell"
const require = createRequire(import.meta.url)
const vueDir = dirname(require.resolve("vue/package.json"))
const vueServerRenderer = require.resolve("vue/server-renderer")

export default defineConfig({
  srcDir: docsDir,
  cleanUrls: true,
  rewrites: {
    "diary/:rest*": "zh/diary/:rest*",
  },

  vite: {
    resolve: {
      alias: [
        {
          find: /^vue\/server-renderer$/,
          replacement: vueServerRenderer,
        },
        { find: /^vue$/, replacement: vueDir },
      ],
    },
  },

  markdown: {
    config(md) {
      demoteDiaryHeadings(md)
    },
  },

  title: "windbell",
  description: "Windbell documentation",

  locales: {
    en: {
      label: "English",
      lang: "en-US",
      link: "/en/",
      title: "windbell",
      description: "Windbell documentation",
      themeConfig: {
        nav: [{ text: "Home", link: "/en/" }],
      },
    },
    zh: {
      label: "中文",
      lang: "zh-CN",
      link: "/zh/",
      title: "风铃",
      description: "Windbell 文档",
      themeConfig: {
        nav: [
          { text: "首页", link: "/zh/" },
          { text: "开发日志", link: "/zh/diary/" },
        ],
        sidebar: {
          "/zh/diary/": markdownSidebar(diaryDir, "/zh/diary/"),
        },
      },
    },
  },

  themeConfig: {
    nav: [
      { text: "English", link: "/en/" },
      { text: "中文", link: "/zh/" },
    ],
    socialLinks: [{ icon: "github", link: repository }],
    search: {
      provider: "local",
    },
    outline: {
      level: [2, 3],
    },
    langMenuLabel: "Change language / 切换语言",
    // English has no diary, so do not try to preserve the current path
    // when switching languages.
    i18nRouting: false,
  },
})
