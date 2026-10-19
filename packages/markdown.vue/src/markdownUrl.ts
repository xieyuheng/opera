const unsafeProtocol = /^(javascript|vbscript|data):/iu

export function safeUrl(
  url: string | null | undefined,
  options: { image?: boolean } = {},
): string | undefined {
  if (url === null || url === undefined) return undefined

  const trimmed = url.trim()
  if (!unsafeProtocol.test(trimmed)) return trimmed

  if (options.image && /^data:image\//iu.test(trimmed)) return trimmed

  return undefined
}
