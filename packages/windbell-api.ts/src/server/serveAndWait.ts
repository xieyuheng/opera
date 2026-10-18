import { serve, type ServerType } from "@hono/node-server"
import type { AddressInfo } from "node:net"

export type ServeAndWaitOptions = Parameters<typeof serve>[0]

export type ServeResult = {
  server: ServerType
  info: AddressInfo
}

export function serveAndWait(
  options: ServeAndWaitOptions,
): Promise<ServeResult> {
  return new Promise((resolve, reject) => {
    let server: ServerType | undefined

    server = serve(options, (info) => {
      if (server === undefined) {
        reject(new Error("[serveAndWait] server is not assigned"))
        return
      }

      resolve({ server, info })
    })

    server.once("error", reject)
  })
}
