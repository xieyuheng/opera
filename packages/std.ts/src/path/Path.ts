export type PathStyle = "posix" | "win32"

export type Path = {
  join(...parts: Array<string>): string
  dirname(path: string): string
  basename(path: string): string
  normalize(path: string): string
  isAbsolute(path: string): boolean
}

export function makePath(style: PathStyle): Path {
  switch (style) {
    case "posix":
      return makePosixPath()

    case "win32":
      return makeWin32Path()
  }
}

export function makePosixPath(): Path {
  return {
    join: (...parts) =>
      normalizePosix(parts.filter((part) => part !== "").join("/")),
    dirname: dirnamePosix,
    basename: basenamePosix,
    normalize: normalizePosix,
    isAbsolute: isAbsolutePosix,
  }
}

export function makeWin32Path(): Path {
  return {
    join: (...parts) =>
      normalizeWin32(parts.filter((part) => part !== "").join("\\")),
    dirname: dirnameWin32,
    basename: basenameWin32,
    normalize: normalizeWin32,
    isAbsolute: isAbsoluteWin32,
  }
}

function normalizePosix(path: string): string {
  const isAbsolute = path.startsWith("/")
  const trailingSeparator = path.length > 1 && path.endsWith("/")
  const stack: Array<string> = []

  for (const part of path.split("/")) {
    if (part === "" || part === ".") continue

    if (part === "..") {
      if (stack.length > 0 && stack[stack.length - 1] !== "..") {
        stack.pop()
      } else if (!isAbsolute) {
        stack.push("..")
      }

      continue
    }

    stack.push(part)
  }

  let result = stack.join("/")

  if (isAbsolute) {
    result = `/${result}`
  }

  if (result === "") {
    result = isAbsolute ? "/" : "."
  }

  if (trailingSeparator && result !== "/") {
    result += "/"
  }

  return result
}

function dirnamePosix(path: string): string {
  if (path === "") return "."

  let end = path.length - 1
  while (end > 0 && path[end] === "/") end -= 1

  const separatorIndex = path.lastIndexOf("/", end)

  if (separatorIndex === -1) return "."
  if (separatorIndex === 0) return "/"

  return path.slice(0, separatorIndex)
}

function basenamePosix(path: string): string {
  let end = path.length - 1
  while (end >= 0 && path[end] === "/") end -= 1

  if (end < 0) return ""

  const separatorIndex = path.lastIndexOf("/", end)
  return path.slice(separatorIndex + 1, end + 1)
}

function isAbsolutePosix(path: string): boolean {
  return path.startsWith("/")
}

function normalizeWin32(path: string): string {
  const normalized = path.replace(/\//g, "\\")
  const { root, rest, absolute } = parseWin32Root(normalized)
  const trailingSeparator = normalized.length > 1 && normalized.endsWith("\\")
  const stack: Array<string> = []

  for (const part of rest.split("\\")) {
    if (part === "" || part === ".") continue

    if (part === "..") {
      if (stack.length > 0 && stack[stack.length - 1] !== "..") {
        stack.pop()
      } else if (!absolute) {
        stack.push("..")
      }

      continue
    }

    stack.push(part)
  }

  if (stack.length === 0) {
    if (root !== "") return root
    return "."
  }

  const separator = root.endsWith("\\") || root === "" ? "" : "\\"
  let result = `${root}${separator}${stack.join("\\")}`

  if (trailingSeparator && result !== root) {
    result += "\\"
  }

  return result
}

function dirnameWin32(path: string): string {
  const normalized = path.replace(/\//g, "\\")
  let end = normalized.length - 1

  while (end > 0 && normalized[end] === "\\") end -= 1

  const clean = normalized.slice(0, end + 1)
  const { root, rest } = parseWin32Root(clean)

  if (rest === "") return root === "" ? "." : root

  const separatorIndex = rest.lastIndexOf("\\")

  if (separatorIndex === -1) {
    return root === "" ? "." : root
  }

  const directory = rest.slice(0, separatorIndex)
  if (directory === "") return root === "" ? "\\" : root

  if (root === "") return directory
  return root.endsWith("\\") ? `${root}${directory}` : `${root}\\${directory}`
}

function basenameWin32(path: string): string {
  const normalized = path.replace(/\//g, "\\")
  let end = normalized.length - 1

  while (end >= 0 && normalized[end] === "\\") end -= 1

  if (end < 0) return ""

  const clean = normalized.slice(0, end + 1)
  const { rest } = parseWin32Root(clean)

  if (rest === "") return ""

  const separatorIndex = rest.lastIndexOf("\\")
  return rest.slice(separatorIndex + 1)
}

function isAbsoluteWin32(path: string): boolean {
  const normalized = path.replace(/\//g, "\\")
  return parseWin32Root(normalized).absolute
}

function parseWin32Root(path: string): {
  root: string
  rest: string
  absolute: boolean
} {
  if (path === "") return { root: "", rest: "", absolute: false }

  if (path.startsWith("\\\\")) {
    const match = /^\\\\[^\\]+\\[^\\]+/.exec(path)

    if (match !== null) {
      const root = match[0]
      return {
        root,
        rest: path.slice(root.length),
        absolute: true,
      }
    }

    return {
      root: "\\\\",
      rest: path.slice(2),
      absolute: true,
    }
  }

  const driveMatch = /^([A-Za-z]:)(.*)$/.exec(path)

  if (driveMatch !== null) {
    const drive = driveMatch[1] ?? ""
    const rest = driveMatch[2] ?? ""

    if (rest.startsWith("\\")) {
      return {
        root: `${drive}\\`,
        rest: rest.slice(1),
        absolute: true,
      }
    }

    return {
      root: drive,
      rest,
      absolute: false,
    }
  }

  if (path.startsWith("\\")) {
    return {
      root: "\\",
      rest: path.slice(1),
      absolute: true,
    }
  }

  return {
    root: "",
    rest: path,
    absolute: false,
  }
}
