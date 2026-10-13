import { makeWindbellClient } from "@windbell/windbell-api.js/client"

export const windbell = makeWindbellClient({
  baseUrl: "/api",
})
