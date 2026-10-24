import { readFlag, readOptionalOption } from "./options.ts"

export function resolveHostname(options: Record<string, unknown>): string {
  const hostname = readOptionalOption(options, "--host")
  const expose = readFlag(options, "--expose")

  if (hostname !== undefined && expose) {
    throw new Error("cannot use --host and --expose together")
  }

  return hostname ?? (expose ? "::" : "127.0.0.1")
}
