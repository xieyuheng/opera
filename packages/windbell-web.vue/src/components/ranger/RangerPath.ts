export function normalizePath(path: string): string {
  if (path === "/") return path

  return path.replace(/[/\\]+$/, "")
}

export function isSamePath(left: string, right: string): boolean {
  return normalizePath(left) === normalizePath(right)
}

export function parentPath(path: string): string {
  const normalized = normalizePath(path)
  const index = Math.max(
    normalized.lastIndexOf("/"),
    normalized.lastIndexOf("\\"),
  )

  if (index === -1) return normalized
  if (index === 0) return "/"
  if (index === 2 && /^[A-Za-z]:/.test(normalized)) {
    return normalized.slice(0, 3)
  }

  return normalized.slice(0, index)
}
