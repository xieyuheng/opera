import { createRequire } from "node:module"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { defineConfig } from "vitepress"

const here = dirname(fileURLToPath(import.meta.url))
const repository = "https://github.com/xieyuheng/opera"
const require = createRequire(import.meta.url)
const vueDir = dirname(require.resolve("vue/package.json"))
const vueServerRenderer = require.resolve("vue/server-renderer")

export default defineConfig({
  appearance: "force-dark",
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
    root: {
      label: "中文",
      lang: "zh-CN",
      title: "风铃",
      description: "「风铃」智能体文档",
    },
    // en: {
    //   label: "English",
    //   lang: "en-US",
    //   link: "/en/",
    //   title: "windbell",
    //   description: "Windbell agent documentation",
    // },
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
