import assert from "node:assert/strict"
import { test } from "node:test"

import { makePath } from "./Path.ts"

test("makePath supports posix", () => {
  const path = makePath("posix")

  assert.equal(path.join("/a", "b", "..", "c"), "/a/c")
  assert.equal(path.dirname("/a/b/c.txt"), "/a/b")
  assert.equal(path.basename("/a/b/c.txt"), "c.txt")
  assert.equal(path.normalize("/a//b/./c/../d"), "/a/b/d")
  assert.equal(path.isAbsolute("/a/b"), true)
  assert.equal(path.isAbsolute("a/b"), false)
})

test("makePath supports win32", () => {
  const path = makePath("win32")

  assert.equal(path.join("C:\\a", "b", "..", "c"), "C:\\a\\c")
  assert.equal(path.dirname("C:\\a\\b\\c.txt"), "C:\\a\\b")
  assert.equal(path.basename("C:\\a\\b\\c.txt"), "c.txt")
  assert.equal(path.normalize("C:\\a\\\\b\\.\\c\\..\\d"), "C:\\a\\b\\d")
  assert.equal(path.isAbsolute("C:\\a\\b"), true)
  assert.equal(path.isAbsolute("a\\b"), false)
})
