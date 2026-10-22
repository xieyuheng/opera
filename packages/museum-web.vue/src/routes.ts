import type { RouteRecordRaw } from "vue-router"

import NotFoundPage from "./pages/errors/NotFoundPage.vue"
import ExhibitPage from "./pages/exhibit/ExhibitPage.vue"

export const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    redirect: { name: "exhibit" },
  },
  {
    path: "/exhibits/:name?",
    name: "exhibit",
    component: ExhibitPage,
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: NotFoundPage,
  },
]
