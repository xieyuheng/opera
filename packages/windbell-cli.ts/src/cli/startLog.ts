export function makeAccessTokenUrl(options: {
  hostname: string
  port: number
  token: string
}): string {
  const hostname = displayHostname(options.hostname)
  const host = hostname.includes(":") ? `[${hostname}]` : hostname
  const url = new URL(`http://${host}:${options.port}/`)
  url.searchParams.set("token", options.token)
  return url.href
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

function displayHostname(hostname: string): string {
  if (hostname === "0.0.0.0" || hostname === "::") return "127.0.0.1"
  return hostname
}
