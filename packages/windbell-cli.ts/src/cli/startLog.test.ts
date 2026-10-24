import assert from "node:assert/strict"
import { test } from "node:test"

import {
  formatLocalDateTime,
  formatServerUrlInfo,
  listServerUrlInfos,
  makeAccessTokenUrl,
  makeServerUrl,
} from "./startLog.ts"

test("makeServerUrl formats IPv4 and IPv6 hosts", () => {
  assert.equal(
    makeServerUrl({ hostname: "localhost", port: 4090 }),
    "http://localhost:4090/",
  )
  assert.equal(
    makeServerUrl({ hostname: "::1", port: 4090 }),
    "http://[::1]:4090/",
  )
  assert.equal(
    makeServerUrl({ hostname: "0.0.0.0", port: 4090 }),
    "http://127.0.0.1:4090/",
  )
  assert.equal(
    makeServerUrl({ hostname: "::", port: 4090 }),
    "http://127.0.0.1:4090/",
  )
})

test("makeAccessTokenUrl appends the access token", () => {
  const url = new URL(
    makeAccessTokenUrl({
      hostname: "192.168.5.4",
      port: 4090,
      token: "test-token",
    }),
  )

  assert.equal(url.origin, "http://192.168.5.4:4090")
  assert.equal(url.searchParams.get("token"), "test-token")
})

test("listServerUrlInfos only lists loopback for localhost", () => {
  assert.deepEqual(listServerUrlInfos("localhost"), [
    { kind: "local", family: "IPv4", hostname: "localhost" },
  ])
})

test("formatServerUrlInfo includes address family and interface", () => {
  assert.equal(
    formatServerUrlInfo({
      kind: "exposed",
      family: "IPv6",
      hostname: "2409::1",
      interfaceName: "wlan0",
    }),
    "exposed (IPv6, wlan0)",
  )
})

test("formatLocalDateTime formats local date and time", () => {
  const date = new Date(2026, 0, 2, 3, 4, 5)

  assert.equal(formatLocalDateTime(date), "2026-01-02 03:04:05")
})
