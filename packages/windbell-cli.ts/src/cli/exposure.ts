import type { ServerUrlInfo } from "./startLog.ts"

export function checkExposedUrlInfos(
  urlInfos: Array<ServerUrlInfo>,
  options: { ipv6: boolean },
): string | undefined {
  const exposed = urlInfos.filter((info) => info.kind === "exposed")

  if (exposed.length === 0) {
    return "no exposed network address"
  }

  if (options.ipv6 && !exposed.some((info) => info.family === "IPv6")) {
    return "no exposed IPv6 address"
  }

  return undefined
}
