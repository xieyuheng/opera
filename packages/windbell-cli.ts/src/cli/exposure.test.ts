import assert from "node:assert/strict"
import { test } from "node:test"

import { checkExposedUrlInfos } from "./exposure.ts"

const local = {
  kind: "local" as const,
  family: "IPv4" as const,
  hostname: "127.0.0.1",
}

const exposedIPv4 = {
  kind: "exposed" as const,
  family: "IPv4" as const,
  hostname: "192.168.5.4",
  interfaceName: "wlan0",
}

const exposedIPv6 = {
  kind: "exposed" as const,
  family: "IPv6" as const,
  hostname: "2409::1",
  interfaceName: "wlan0",
}

test("checkExposedUrlInfos requires an exposed address", () => {
  assert.equal(
    checkExposedUrlInfos([local], { ipv6: false }),
    "no exposed network address",
  )
})

test("checkExposedUrlInfos accepts exposed IPv4", () => {
  assert.equal(
    checkExposedUrlInfos([local, exposedIPv4], { ipv6: false }),
    undefined,
  )
})

test("checkExposedUrlInfos requires IPv6 when --ipv6 is enabled", () => {
  assert.equal(
    checkExposedUrlInfos([local, exposedIPv4], { ipv6: true }),
    "no exposed IPv6 address",
  )
})

test("checkExposedUrlInfos accepts exposed IPv6 when --ipv6 is enabled", () => {
  assert.equal(
    checkExposedUrlInfos([local, exposedIPv4, exposedIPv6], { ipv6: true }),
    undefined,
  )
})
