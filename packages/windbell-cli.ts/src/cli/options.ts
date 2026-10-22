export function readRequiredOption(
  options: Record<string, unknown>,
  name: string,
): string {
  const value = options[name]
  if (typeof value !== "string" || value === "") {
    throw new Error(`missing option: ${name}`)
  }

  return value
}

export function readOptionalOption(
  options: Record<string, unknown>,
  name: string,
): string | undefined {
  const value = options[name]
  if (typeof value !== "string" || value === "") {
    return undefined
  }

  return value
}

export function parsePositiveInt(value: unknown, fallback: number): number {
  if (value === undefined || value === "") return fallback

  const number = Number(value)
  if (!Number.isInteger(number) || number <= 0) {
    throw new Error(`invalid positive integer: ${String(value)}`)
  }

  return number
}

export function readFlag(
  options: Record<string, unknown>,
  name: string,
): boolean {
  return Object.hasOwn(options, name)
}
