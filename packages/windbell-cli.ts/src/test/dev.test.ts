import assert from "node:assert/strict"
import { test } from "node:test"

import { resolveDevOptions } from "../cli/dev/resolveDevOptions.ts"

test("resolveDevOptions leaves ports undefined by default", () => {
  const previousApiPort = process.env.API_PORT
  const previousWebPort = process.env.WEB_PORT

  delete process.env.API_PORT
  delete process.env.WEB_PORT

  try {
    const options = resolveDevOptions({})
    assert.equal(options.apiPort, undefined)
    assert.equal(options.webPort, undefined)
  } finally {
    restoreEnv("API_PORT", previousApiPort)
    restoreEnv("WEB_PORT", previousWebPort)
  }
})

test("resolveDevOptions reads explicit ports", () => {
  const options = resolveDevOptions({
    "--api-port": "4100",
    "--web-port": "5200",
  })

  assert.equal(options.apiPort, 4100)
  assert.equal(options.webPort, 5200)
})

test("resolveDevOptions rejects invalid ports", () => {
  assert.throws(
    () => resolveDevOptions({ "--api-port": "not-a-port" }),
    /invalid positive integer/,
  )
})

test("resolveDevOptions defaults to IPv4 loopback", () => {
  assert.equal(resolveDevOptions({}).hostname, "127.0.0.1")
})

test("resolveDevOptions exposes all interfaces with --expose", () => {
  assert.equal(resolveDevOptions({ "--expose": true }).hostname, "::")
})

test("resolveDevOptions disables IPv6 by default", () => {
  assert.equal(resolveDevOptions({ "--expose": true }).ipv6, false)
})

test("resolveDevOptions enables IPv6 with --expose --ipv6", () => {
  assert.equal(
    resolveDevOptions({ "--expose": true, "--ipv6": true }).ipv6,
    true,
  )
})

test("resolveDevOptions tracks --expose", () => {
  assert.equal(resolveDevOptions({ "--expose": true }).expose, true)
  assert.equal(resolveDevOptions({}).expose, false)
})

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name]
  } else {
    process.env[name] = value
  }
}
