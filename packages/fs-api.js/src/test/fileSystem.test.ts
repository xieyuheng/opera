import assert from "node:assert/strict"
import fs from "node:fs/promises"
import Os from "node:os"
import Path from "node:path"
import { test } from "node:test"
import type { Result } from "@windbell/std.js/result"
import { unwrap } from "@windbell/std.js/result"
import type { FileSystemError, FileSystemWatchEvent } from "@windbell/fs.js/fs"
import { makeHttpFileSystemClient } from "../client/index.ts"
import { makeHttpFileSystemRouter } from "../router/index.ts"
import { startHttpFileSystemServer } from "../server/index.ts"

async function value<T>(
  result: Promise<Result<T, FileSystemError>>,
): Promise<T> {
  return unwrap(await result)
}

test("GET /health", async () => {
  const app = makeHttpFileSystemRouter()
  const response = await app.request("/health")

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {
    ok: true,
    service: "fs-api",
  })
})

test("fileSystem client watch", async (t) => {
  const root = await fs.mkdtemp(
    Path.join(Os.tmpdir(), "windbell-watch-client-"),
  )

  const { server, url } = await startHttpFileSystemServer({
    hostname: "127.0.0.1",
    port: 0,
    basePath: "/fs",
  })

  const client = makeHttpFileSystemClient({ baseUrl: url })
  const events: Array<FileSystemWatchEvent> = []
  const controller = new AbortController()

  const done = (async () => {
    for await (const event of client.watch(root, {
      signal: controller.signal,
    })) {
      events.push(event)

      if (event.type === "close") return
    }
  })()

  t.after(async () => {
    controller.abort()
    await done.catch(() => undefined)

    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })

    await fs.rm(root, { recursive: true, force: true })
  })

  await waitFor(() =>
    events.some((event) => event.type === "ready" && event.path === root),
  )

  const textFile = Path.join(root, "a.txt")
  await fs.writeFile(textFile, "hello")

  await waitFor(() =>
    events.some(
      (event) =>
        event.type === "change" &&
        event.path === textFile &&
        event.filename === "a.txt",
    ),
  )
})

test("fileSystem client and server", async (t) => {
  const root = await fs.mkdtemp(Path.join(Os.tmpdir(), "windbell-fs-"))
  const { server, url } = await startHttpFileSystemServer({
    hostname: "127.0.0.1",
    port: 0,
    basePath: "/fs",
  })

  const client = makeHttpFileSystemClient({ baseUrl: url })

  t.after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })

    await fs.rm(root, { recursive: true, force: true })
  })

  assert.equal(await value(client.home()), Os.homedir())
  assert.deepEqual(await value(client.platform()), {
    name: Os.platform(),
    pathStyle: Os.platform() === "win32" ? "win32" : "posix",
  })
  assert.equal(await value(client.exists(root)), true)
  assert.equal(await value(client.isDirectory(root)), true)
  assert.equal(await value(client.isFile(root)), false)

  const textFile = Path.join(root, "notes", "a.md")
  assert.equal(await value(client.exists(textFile)), false)

  await value(client.ensureFile(textFile))
  assert.equal(await value(client.exists(textFile)), true)
  assert.equal(await value(client.isFile(textFile)), true)

  await value(client.write(textFile, "# Hello"))
  assert.equal(await value(client.read(textFile)), "# Hello")
  assert.deepEqual(
    await value(client.readBytes(textFile)),
    new TextEncoder().encode("# Hello"),
  )
  assert.equal(await value(client.classifyFile(textFile)), "text")

  const textFileStat = await value(client.stat(textFile))
  assert.equal(textFileStat.kind, "File")
  assert.equal(textFileStat.size, new TextEncoder().encode("# Hello").length)
  assert.equal(typeof textFileStat.mtimeMs, "number")

  const exclusiveFile = Path.join(root, "exclusive.lock")
  await value(client.createFileExclusive(exclusiveFile, "first"))
  const conflict = await client.createFileExclusive(exclusiveFile, "second")
  assert.equal(conflict.kind, "ErrorResult")
  if (conflict.kind === "ErrorResult") {
    assert.equal(conflict.error.type, "already-exists")
  }
  await value(client.deleteFile(exclusiveFile))

  const emptyFile = Path.join(root, "empty.txt")
  await value(client.ensureFile(emptyFile))
  assert.equal(await value(client.read(emptyFile)), "")

  await value(client.ensureDirectory(Path.join(root, "empty-dir")))
  assert.deepEqual(await value(client.list(Path.join(root, "empty-dir"))), [])
  assert.deepEqual(await value(client.list(Path.join(root, "notes"))), [
    textFile,
  ])

  const listRoot = await value(client.list(root))
  assert.deepEqual(listRoot, [
    Path.join(root, "empty-dir"),
    emptyFile,
    Path.join(root, "notes"),
  ])

  const entries = await value(client.listEntries(root))
  assert.deepEqual(entries, [
    {
      name: "empty-dir",
      path: Path.join(root, "empty-dir"),
      kind: "Directory",
    },
    {
      name: "empty.txt",
      path: emptyFile,
      kind: "File",
    },
    {
      name: "notes",
      path: Path.join(root, "notes"),
      kind: "Directory",
    },
  ])

  const recursive = await value(client.listRecursive(root))
  assert.deepEqual(recursive, [
    Path.join(root, "empty-dir"),
    emptyFile,
    Path.join(root, "notes"),
    textFile,
  ])

  const renamedFile = Path.join(root, "renamed.md")
  await value(client.rename(textFile, renamedFile))
  assert.equal(await value(client.exists(textFile)), false)
  assert.equal(await value(client.read(renamedFile)), "# Hello")

  await value(client.deleteFile(renamedFile))
  assert.equal(await value(client.exists(renamedFile)), false)

  await value(client.deleteDirectory(Path.join(root, "empty-dir")))
  assert.equal(await value(client.exists(Path.join(root, "empty-dir"))), false)

  await value(client.delete(Path.join(root, "notes")))
  assert.equal(await value(client.exists(Path.join(root, "notes"))), false)
})

async function waitFor(
  predicate: () => boolean,
  timeoutMs = 3_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs

  while (!predicate() && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 20))
  }

  assert.equal(predicate(), true)
}
