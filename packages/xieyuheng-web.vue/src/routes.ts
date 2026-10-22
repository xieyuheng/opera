import type { RouteRecordRaw } from "vue-router"

import HomePage from "./pages/HomePage.vue"
import NotFoundPage from "./pages/NotFoundPage.vue"

export const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "home",
    component: HomePage,
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: NotFoundPage,
  },
]
