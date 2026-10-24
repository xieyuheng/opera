import assert from "node:assert/strict"
import { test } from "node:test"

import { resolveHostname, resolveIpv6 } from "./resolveHostname.ts"

test("resolveHostname defaults to IPv4 loopback", () => {
  assert.equal(resolveHostname({}), "127.0.0.1")
})

test("resolveHostname exposes all interfaces with --expose", () => {
  assert.equal(resolveHostname({ "--expose": true }), "::")
})

test("resolveHostname reads an explicit host", () => {
  assert.equal(resolveHostname({ "--host": "0.0.0.0" }), "0.0.0.0")
})

test("resolveHostname rejects --host together with --expose", () => {
  assert.throws(
    () => resolveHostname({ "--host": "0.0.0.0", "--expose": true }),
    /cannot use --host and --expose together/,
  )
})

test("resolveIpv6 requires --expose", () => {
  assert.throws(() => resolveIpv6({ "--ipv6": true }), /requires --expose/)
})

test("resolveIpv6 can be enabled with --expose", () => {
  assert.equal(resolveIpv6({ "--expose": true, "--ipv6": true }), true)
})
