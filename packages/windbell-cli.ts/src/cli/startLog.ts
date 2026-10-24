import Os from "node:os"

export type ListServerUrlInfosOptions = {
  ipv6?: boolean
}

export type ServerUrlInfo = {
  kind: "local" | "exposed"
  family: "IPv4" | "IPv6"
  hostname: string
  interfaceName?: string
}

export function listServerUrlInfos(
  hostname: string,
  options: ListServerUrlInfosOptions = {},
): Array<ServerUrlInfo> {
  if (hostname === "0.0.0.0") {
    return [
      { kind: "local", family: "IPv4", hostname: "127.0.0.1" },
      ...listExposedAddresses("IPv4"),
    ]
  }

  if (hostname === "::") {
    return [
      { kind: "local", family: "IPv4", hostname: "127.0.0.1" },
      ...listExposedAddresses("IPv4"),
      ...(options.ipv6 ? listExposedAddresses("IPv6") : []),
    ]
  }

  if (hostname === "localhost") {
    return [{ kind: "local", family: "IPv4", hostname }]
  }

  if (hostname === "127.0.0.1") {
    return [{ kind: "local", family: "IPv4", hostname }]
  }

  if (hostname === "::1") {
    return [{ kind: "local", family: "IPv6", hostname }]
  }

  return [
    {
      kind: "exposed",
      family: hostname.includes(":") ? "IPv6" : "IPv4",
      hostname,
    },
  ]
}

export function formatServerUrlInfo(info: ServerUrlInfo): string {
  const details: Array<string> = [info.family]

  if (info.interfaceName !== undefined) {
    details.push(info.interfaceName)
  }

  return `${info.kind} (${details.join(", ")})`
}

export function makeServerUrl(options: {
  hostname: string
  port: number
}): string {
  const hostname =
    options.hostname === "0.0.0.0" || options.hostname === "::"
      ? "127.0.0.1"
      : options.hostname
  return `http://${formatUrlHostname(hostname)}:${options.port}/`
}

export function formatLocalDateTime(date: Date): string {
  return [
    String(date.getFullYear()).padStart(4, "0"),
    "-",
    String(date.getMonth() + 1).padStart(2, "0"),
    "-",
    String(date.getDate()).padStart(2, "0"),
    " ",
    String(date.getHours()).padStart(2, "0"),
    ":",
    String(date.getMinutes()).padStart(2, "0"),
    ":",
    String(date.getSeconds()).padStart(2, "0"),
  ].join("")
}

export function makeAccessTokenUrl(options: {
  hostname: string
  port: number
  token: string
}): string {
  const url = new URL(
    makeServerUrl({ hostname: options.hostname, port: options.port }),
  )
  url.searchParams.set("token", options.token)
  return url.href
}

function formatUrlHostname(hostname: string): string {
  return hostname.includes(":") ? `[${hostname}]` : hostname
}

function listExposedAddresses(family: "IPv4" | "IPv6"): Array<ServerUrlInfo> {
  const infos: Array<ServerUrlInfo> = []
  const seen = new Set<string>()

  for (const [interfaceName, addresses] of Object.entries(
    Os.networkInterfaces(),
  )) {
    for (const address of addresses ?? []) {
      if (address.internal) continue
      if (address.family !== family) continue

      // Browser URLs cannot carry an IPv6 zone id, so link-local addresses
      // cannot be represented as usable URLs.
      if (family === "IPv6" && address.address.startsWith("fe80:")) continue

      const key = `${family}:${address.address}`
      if (seen.has(key)) continue
      seen.add(key)

      infos.push({
        kind: "exposed",
        family,
        hostname: address.address,
        interfaceName,
      })
    }
  }

  return infos
}
