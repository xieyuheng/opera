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
    root: {
      label: "English",
      lang: "en-US",
      title: "windbell",
      description: "Windbell documentation",
    },
    zh: {
      label: "中文",
      lang: "zh-CN",
      link: "/zh/",
      title: "风铃",
      description: "Windbell 文档",
      themeConfig: {
        nav: [
          {
            text: "说明书",
            link: "/zh/manual/",
          },
        ],
        sidebar: {
          "/zh/manual/": [
            {
              text: "说明书",
              items: [
                { text: "题解", link: "/zh/manual/" },
                { text: "安装", link: "/zh/manual/installation" },
              ],
            },
          ],
        },
      },
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
