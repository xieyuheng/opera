import assert from "node:assert/strict"
import process from "node:process"
import { test } from "node:test"
import { unwrap } from "@windbell/std.js/result"
import { makeLocalBash } from "../../local-sh/index.ts"
import { makeHttpBash } from "../client/index.ts"
import { startShellServer } from "../server/index.ts"

test(
  "local bash runs a command",
  { skip: process.platform === "win32" },
  async () => {
    const sh = makeLocalBash()
    const output = unwrap(await sh.run("printf hello", { cwd: process.cwd() }))

    assert.equal(output.exitCode, 0)
    assert.equal(output.stdout, "hello")
    assert.equal(output.stderr, "")
    assert.equal(output.cancelled, false)
  },
)

test(
  "http bash runs a command",
  { skip: process.platform === "win32" },
  async (t) => {
    const { server, url } = await startShellServer({
      hostname: "127.0.0.1",
      port: 0,
      basePath: "/sh",
    })

    const sh = makeHttpBash({ baseUrl: url })

    t.after(async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
      })
    })

    const output = unwrap(await sh.run("printf hello", { cwd: process.cwd() }))

    assert.equal(output.exitCode, 0)
    assert.equal(output.stdout, "hello")
    assert.equal(output.stderr, "")
  },
)
