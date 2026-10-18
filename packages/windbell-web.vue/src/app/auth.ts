export const ACCESS_TOKEN_STORAGE_KEY = "windbell.access-token"

export function readAccessToken(): string | undefined {
  try {
    return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY) ?? undefined
  } catch {
    return undefined
  }
}

export function clearAccessToken(): void {
  try {
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
  } catch {
    // ignore storage errors
  }
}

export function authHeaders(): Headers {
  const headers = new Headers()
  const accessToken = readAccessToken()

  if (accessToken !== undefined) {
    headers.set("Authorization", `Bearer ${accessToken}`)
  }

  return headers
}
