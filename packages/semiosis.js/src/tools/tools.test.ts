import assert from "node:assert/strict"
import fs from "node:fs/promises"
import Os from "node:os"
import Path from "node:path"
import { test } from "node:test"
import { makeBashToolHandler, makeBashToolSign } from "./bash/index.ts"
import { assertSessionToolPlatform } from "./assertSessionToolPlatform.ts"
import {
  platformShellName,
  makeDefaultToolRouter,
} from "./makeDefaultToolRouter.ts"
import { makePwshToolSign } from "./pwsh/index.ts"
import { resolvePwshPath } from "@windbell/sh.js/pwsh"

test("platformShellName chooses bash on posix and pwsh on win32", () => {
  assert.equal(platformShellName("linux"), "bash")
  assert.equal(platformShellName("darwin"), "bash")
  assert.equal(platformShellName("win32"), "pwsh")
})

test("assertSessionToolPlatform accepts matching shell tools", () => {
  const bashSign = makeBashToolSign({ description: "Run bash." })
  const pwshSign = makePwshToolSign({ description: "Run pwsh." })

  assert.doesNotThrow(() => assertSessionToolPlatform([bashSign], "linux"))
  assert.doesNotThrow(() => assertSessionToolPlatform([pwshSign], "win32"))
})

test("assertSessionToolPlatform rejects mismatched shell tools", () => {
  const bashSign = makeBashToolSign({ description: "Run bash." })
  const pwshSign = makePwshToolSign({ description: "Run pwsh." })

  assert.throws(
    () => assertSessionToolPlatform([pwshSign], "linux"),
    /session shell tool "pwsh" does not match shell "bash"/,
  )
  assert.throws(
    () => assertSessionToolPlatform([bashSign], "win32"),
    /session shell tool "bash" does not match shell "pwsh"/,
  )
})

test("assertSessionToolPlatform ignores sessions without shell tools", () => {
  assert.doesNotThrow(() => assertSessionToolPlatform([], "win32"))
})

test("resolvePwshPath trusts an explicit path", () => {
  assert.equal(
    resolvePwshPath("C:\\Tools\\pwsh.exe", {}, "win32"),
    "C:\\Tools\\pwsh.exe",
  )
})

test("resolvePwshPath falls back to pwsh outside win32", () => {
  assert.equal(resolvePwshPath(undefined, {}, "linux"), "pwsh")
})

test("makeDefaultToolRouter defines the platform shell tool", () => {
  assert.equal(
    makeDefaultToolRouter({ cwd: process.cwd() }).toolSigns[0]?.name,
    platformShellName(),
  )
})

test("resolvePwshPath probes well-known win32 install locations", async () => {
  const root = await fs.mkdtemp(Path.join(Os.tmpdir(), "semiosis-pwsh-path-"))

  try {
    const dir = Path.join(root, "PowerShell", "7")
    const pwshPath = Path.join(dir, "pwsh.exe")

    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(pwshPath, "")

    assert.equal(
      resolvePwshPath(undefined, { ProgramFiles: root, PATH: "" }, "win32"),
      pwshPath,
    )
  } finally {
    await fs.rm(root, { recursive: true, force: true })
  }
})

test(
  "bash tool handler can be cancelled",
  { skip: process.platform === "win32" },
  async () => {
    const controller = new AbortController()
    const handler = makeBashToolHandler({
      cwd: process.cwd(),
      timeoutMs: 5_000,
      maxOutputChars: 1_000,
    })

    const outputPromise = handler(
      { command: "sleep 5" },
      { signal: controller.signal },
    )

    setTimeout(() => controller.abort(), 20)

    const output = await outputPromise

    assert.match(output, /\[cancelled\]/)
  },
)
