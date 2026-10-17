export const signDisplayModes = ["expand", "digest", "overview"] as const

export type SignDisplayMode = (typeof signDisplayModes)[number]

export function isSignDisplayMode(value: unknown): value is SignDisplayMode {
  return (
    typeof value === "string" &&
    (signDisplayModes as readonly string[]).includes(value)
  )
}

export function nextSignDisplayMode(mode: SignDisplayMode): SignDisplayMode {
  const index = signDisplayModes.indexOf(mode)
  return signDisplayModes[(index + 1) % signDisplayModes.length] ?? "expand"
}
