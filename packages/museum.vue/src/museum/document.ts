const pendingDocuments = new Map<string, Promise<string>>()

export async function loadDocument(url: URL): Promise<string> {
  const href = url.href
  const existing = pendingDocuments.get(href)
  if (existing !== undefined) return existing

  const pending = (async () => {
    const response = await fetch(url, { cache: "no-cache" })
    if (!response.ok) {
      throw new Error(
        `failed to fetch document: ${response.status} ${response.statusText} (${url.href})`,
      )
    }

    return await response.text()
  })()

  pendingDocuments.set(href, pending)

  try {
    return await pending
  } catch (error) {
    pendingDocuments.delete(href)
    throw error
  }
}
