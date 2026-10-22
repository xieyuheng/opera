import tailwindcss from "@tailwindcss/vite"
import vue from "@vitejs/plugin-vue"
import { homedir } from "node:os"
import path from "node:path"
import sirv from "sirv"
import { defineConfig, type Plugin } from "vite"

function serveContentFiles(contentDir: string): Plugin {
  return {
    name: "serve-content-files",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(
        "/files",
        sirv(contentDir, {
          dev: true,
          etag: true,
        }),
      )
    },
  }
}

function watchContentFiles(contentDir: string): Plugin {
  const contentRoot = path.resolve(contentDir)

  return {
    name: "watch-content-files",
    apply: "serve",
    configureServer(server) {
      server.watcher.add(contentRoot)

      const onChange = (_event: string, file: string): void => {
        const changedPath = path.resolve(file)
        if (
          changedPath === contentRoot ||
          changedPath.startsWith(`${contentRoot}${path.sep}`)
        ) {
          server.ws.send({ type: "full-reload" })
        }
      }

      server.watcher.on("all", onChange)
      server.httpServer?.once("close", () => {
        server.watcher.off("all", onChange)
      })
    },
  }
}

export default defineConfig(({ command }) => {
  const contentDir = path.join(homedir(), "studium")

  return {
    // - when: using __MUSEUM_CONTENT_BASE_URL__, bind it to a script setup variable
    //   such as `const contentBaseUrl = __MUSEUM_CONTENT_BASE_URL__`.
    // - why: use JSON.stringify, because define values are injected as raw
    //   JavaScript expressions and strings must become valid quoted literals.
    define: {
      __MUSEUM_CONTENT_BASE_URL__: JSON.stringify(
        command === "serve"
          ? "/files/"
          : "https://studium.xieyuheng.com/",
      ),
    },
    server: { host: "localhost" },
    build: {
      sourcemap: true,
    },
    plugins: [
      vue(),
      tailwindcss(),
      serveContentFiles(contentDir),
      watchContentFiles(contentDir),
    ],
  }
})
