import { makeHttpFileSystemClient } from "@windbell/fs-api.ts/client"
import { authHeaders } from "./auth.ts"

export const windbellFs = makeHttpFileSystemClient({
  baseUrl: "/api/fs",
  headers: authHeaders,
})
