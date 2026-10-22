import { makeWindbellClient } from "@xieyuheng/windbell-api.ts/client"

import { authHeaders } from "./auth.ts"

export const windbell = makeWindbellClient({
  baseUrl: "/api",
  headers: authHeaders,
})
