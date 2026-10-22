import { createRequire } from "node:module"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { defineConfig } from "vitepress"

const here = dirname(fileURLToPath(import.meta.url))
const docsDir = resolve(here, "../docs")
const repository = "https://github.com/xieyuheng/opera"
const require = createRequire(import.meta.url)
const vueDir = dirname(require.resolve("vue/package.json"))
const vueServerRenderer = require.resolve("vue/server-renderer")

export default defineConfig({
  srcDir: docsDir,
  cleanUrls: true,

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

  title: "windbell",
  description: "Windbell documentation",

  locales: {
    en: {
      label: "English",
      lang: "en-US",
      link: "/en/",
      title: "windbell",
      description: "Windbell documentation",
    },
    zh: {
      label: "中文",
      lang: "zh-CN",
      link: "/zh/",
      title: "风铃",
      description: "Windbell 文档",
    },
  },

  themeConfig: {
    socialLinks: [{ icon: "github", link: repository }],
    search: {
      provider: "local",
    },
    outline: {
      level: [2, 3],
    },
    langMenuLabel: "Change language / 切换语言",
  },
})
