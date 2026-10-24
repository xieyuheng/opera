import assert from "node:assert/strict"
import { test } from "node:test"

import { resolveHostname } from "./resolveHostname.ts"

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
