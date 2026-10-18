import { makeHttpFileSystemClient } from "@windbell/fs-api.js/client"
import { authHeaders } from "./auth.ts"

export const windbellFs = makeHttpFileSystemClient({
  baseUrl: "/api/fs",
  headers: authHeaders,
})
