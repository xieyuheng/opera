import assert from "node:assert/strict"
import { makeLocalFileSystem } from "@windbell/fs.js/local-fs"
import { makePath } from "@windbell/std.js/path"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import Path from "node:path"
import process from "node:process"
import { test } from "node:test"
import * as S from "@windbell/semiosis.js"
import { isAccessTokenExpired, makeAccessTokenStore } from "./AccessToken.ts"

test("access token store", async (t) => {
  const root = await mkdtemp(Path.join(tmpdir(), "windbell-access-token-"))
  const database = S.makeDatabase({
    fs: makeLocalFileSystem(),
    path: makePath(process.platform === "win32" ? "win32" : "posix"),
    root,
  })
  const store = makeAccessTokenStore({ database })

  t.after(async () => {
    await rm(root, { recursive: true, force: true })
  })

  const accessToken = await store.create()
  assert.match(accessToken.value, /^[A-Za-z0-9_-]+$/)
  assert.equal(accessToken.createdAt, accessToken.updatedAt)
  assert.equal(accessToken.expiredAt, undefined)

  const path = Path.join(root, ".secrets", "tokens", accessToken.value)
  const file = JSON.parse(await readFile(path, "utf8")) as Record<
    string,
    unknown
  >
  assert.equal(file.value, accessToken.value)
  assert.equal(file.createdAt, accessToken.createdAt)
  assert.equal(file.updatedAt, accessToken.updatedAt)

  const older = await store.touch(accessToken.value)
  assert.ok(older !== undefined)
  assert.ok(older.updatedAt >= accessToken.updatedAt)

  const tokens = await store.list()
  assert.deepEqual(
    tokens.map((token) => token.value),
    [accessToken.value],
  )

  const expiring = await store.create({
    expiredAt: Date.now() + 60_000,
  })
  assert.equal(isAccessTokenExpired(expiring), false)
  assert.equal(isAccessTokenExpired(expiring, expiring.expiredAt! + 1), true)

  assert.equal(await store.remove(accessToken.value), true)
  assert.equal(await store.remove(accessToken.value), false)
  assert.deepEqual(
    (await store.list()).map((token) => token.value),
    [expiring.value],
  )
})
