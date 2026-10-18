import type { UseDataLoader } from "vue-router/experimental"

declare module "vue-router" {
  interface RouteMeta {
    loaders?: Array<UseDataLoader>
  }
}
