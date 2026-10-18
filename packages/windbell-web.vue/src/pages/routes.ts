import type { RouteRecordRaw } from "vue-router"
import HomePage from "./home/HomePage.vue"
import { useHomeState } from "./home/useHomeState.ts"
import MarkdownRenderPage from "./markdown/MarkdownRenderPage.vue"
import ProviderListPage from "./provider-list/ProviderListPage.vue"
import { useProviderListState } from "./provider-list/useProviderListState.ts"
import ProviderPage from "./provider/ProviderPage.vue"
import { useProviderState } from "./provider/useProviderState.ts"
import NotFoundPage from "./errors/NotFoundPage.vue"
import SessionDustbinPage from "./session-dustbin/SessionDustbinPage.vue"
import { useSessionDustbinState } from "./session-dustbin/useSessionDustbinState.ts"
import WorkspaceDustbinPage from "./workspace-dustbin/WorkspaceDustbinPage.vue"
import { useWorkspaceDustbinState } from "./workspace-dustbin/useWorkspaceDustbinState.ts"
import SessionPage from "./session/SessionPage.vue"
import { useSessionState } from "./session/useSessionState.ts"
import SettingsPage from "./settings/SettingsPage.vue"
import ToolboxPage from "./toolbox/ToolboxPage.vue"
import ThemeListPage from "./theme-list/ThemeListPage.vue"
import ThemePage from "./theme/ThemePage.vue"
import WorkspacePage from "./workspace/WorkspacePage.vue"
import { useWorkspaceState } from "./workspace/useWorkspaceState.ts"

export const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    redirect: "/home",
  },
  {
    path: "/home",
    name: "home",
    component: HomePage,
    meta: {
      loaders: [useHomeState],
    },
  },
  {
    path: "/workspaces/:workspaceId/sessions",
    redirect: (to) => ({
      name: "workspace",
      params: {
        workspaceId: to.params.workspaceId,
      },
    }),
  },
  {
    path: "/workspaces/:workspaceId",
    name: "workspace",
    component: WorkspacePage,
    meta: {
      loaders: [useWorkspaceState],
    },
  },
  {
    path: "/workspace-dustbin",
    name: "workspace-dustbin",
    component: WorkspaceDustbinPage,
    meta: {
      loaders: [useWorkspaceDustbinState],
    },
  },
  {
    path: "/workspaces/:workspaceId/session-dustbin",
    name: "session-dustbin",
    component: SessionDustbinPage,
    meta: {
      loaders: [useSessionDustbinState],
    },
  },
  {
    path: "/sessions/:sessionId",
    name: "session",
    component: SessionPage,
    meta: {
      loaders: [useSessionState],
    },
  },
  {
    path: "/providers",
    name: "provider-list",
    component: ProviderListPage,
    meta: {
      loaders: [useProviderListState],
    },
  },
  {
    path: "/providers/:providerName",
    name: "provider",
    component: ProviderPage,
    meta: {
      loaders: [useProviderState],
    },
  },
  {
    path: "/settings",
    name: "settings",
    component: SettingsPage,
  },
  {
    path: "/toolbox",
    name: "toolbox",
    component: ToolboxPage,
  },
  {
    path: "/themes",
    name: "theme-list",
    component: ThemeListPage,
  },
  {
    path: "/themes/new",
    name: "theme-new",
    component: ThemePage,
  },
  {
    path: "/themes/:themeId",
    name: "theme",
    component: ThemePage,
  },
  {
    path: "/markdown",
    name: "markdown",
    component: MarkdownRenderPage,
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: NotFoundPage,
  },
]
