import { createHead } from "@unhead/vue/client"
import { createApp } from "vue"
import { createRouter, createWebHistory } from "vue-router"

import App from "./App.vue"
import { routes } from "./routes.ts"

import "./styles/index.css"

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

const app = createApp(App)

app.use(createHead())
app.use(router)

await router.isReady()
app.mount("#app")
