import { readFlag, readOptionalOption } from "./options.ts"

export function resolveHostname(options: Record<string, unknown>): string {
  const hostname = readOptionalOption(options, "--host")
  const expose = readFlag(options, "--expose")

  if (hostname !== undefined && expose) {
    throw new Error("cannot use --host and --expose together")
  }

  return hostname ?? (expose ? "::" : "127.0.0.1")
}

export function resolveIpv6(options: Record<string, unknown>): boolean {
  const ipv6 = readFlag(options, "--ipv6")
  const expose = readFlag(options, "--expose")

  if (ipv6 && !expose) {
    throw new Error("--ipv6 requires --expose")
  }

  return ipv6
}
