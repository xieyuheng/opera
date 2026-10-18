import { makeWindbellClient } from "@windbell/windbell-api.js/client"
import { authHeaders } from "./auth.ts"

export const windbell = makeWindbellClient({
  baseUrl: "/api",
  headers: authHeaders,
})
