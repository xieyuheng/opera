import type { LocationQueryValue } from "vue-router"

export const markdownSourceQueryKey = "md"

export function encodeMarkdownSource(source: string): string {
  const bytes = new TextEncoder().encode(source)
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "")
}

export function decodeMarkdownSource(value: string): string {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/")
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function markdownSourceFromQuery(
  value: LocationQueryValue | Array<LocationQueryValue>,
): string | undefined {
  const encoded = Array.isArray(value) ? value[0] : value
  if (encoded === null || encoded === undefined) return undefined

  try {
    return decodeMarkdownSource(encoded)
  } catch {
    return undefined
  }
}
