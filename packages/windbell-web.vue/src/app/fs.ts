import { makeHttpFileSystemClient } from "@xieyuheng/fs-api.ts/client"

import { authHeaders } from "./auth.ts"

export const windbellFs = makeHttpFileSystemClient({
  baseUrl: "/api/fs",
  headers: authHeaders,
})
