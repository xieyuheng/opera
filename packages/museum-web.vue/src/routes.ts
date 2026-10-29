import type { RouteRecordRaw } from "vue-router"

import NotFoundPage from "./pages/errors/NotFoundPage.vue"
import ExhibitPage from "./pages/exhibit/ExhibitPage.vue"
import SettingsPage from "./pages/settings/SettingsPage.vue"

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
    path: "/settings",
    name: "settings",
    component: SettingsPage,
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: NotFoundPage,
  },
]
