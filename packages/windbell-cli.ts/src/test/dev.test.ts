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

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name]
  } else {
    process.env[name] = value
  }
}
