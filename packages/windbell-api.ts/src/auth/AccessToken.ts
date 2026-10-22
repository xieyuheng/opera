import { randomBytes } from "node:crypto"

import type * as S from "@xieyuheng/semiosis.ts"

export type AccessToken = {
  value: string
  createdAt: number
  updatedAt: number
  expiredAt?: number
}

export type AccessTokenStoreOptions = {
  database: S.Database
}

export type AccessTokenStore = {
  root: string
  list(): Promise<Array<AccessToken>>
  get(value: string): Promise<AccessToken | undefined>
  create(options?: { expiredAt?: number }): Promise<AccessToken>
  put(accessToken: AccessToken): Promise<void>
  touch(value: string): Promise<AccessToken | undefined>
  remove(value: string): Promise<boolean>
}

const accessTokenPattern = /^[A-Za-z0-9_-]+$/

export function isAccessTokenExpired(
  accessToken: AccessToken,
  now: number = Date.now(),
): boolean {
  return accessToken.expiredAt !== undefined && accessToken.expiredAt <= now
}

export function makeAccessTokenStore(
  options: AccessTokenStoreOptions,
): AccessTokenStore {
  const { database } = options
  const root = database.path.join(database.root, ".secrets", "tokens")
  const touchQueues = new Map<string, Promise<unknown>>()

  function accessTokenPath(value: string): string {
    return database.path.join(root, value)
  }

  function isSafeTokenValue(value: string): boolean {
    return accessTokenPattern.test(value)
  }

  async function get(value: string): Promise<AccessToken | undefined> {
    if (!isSafeTokenValue(value)) return undefined

    const result = await database.files.readJsonFile(accessTokenPath(value))
    if (result.kind === "ErrorResult") return undefined

    const accessToken = parseAccessToken(result.value)
    if (accessToken === undefined || accessToken.value !== value) {
      return undefined
    }

    return accessToken
  }

  async function put(accessToken: AccessToken): Promise<void> {
    if (!isSafeTokenValue(accessToken.value)) {
      throw new Error(`invalid access token value: ${accessToken.value}`)
    }

    const path = accessTokenPath(accessToken.value)
    const temporaryPath = database.path.join(
      root,
      `.${accessToken.value}.${randomBytes(6).toString("hex")}.tmp`,
    )

    const writeResult = await database.files.writeTextFile(
      temporaryPath,
      `${JSON.stringify(accessToken, null, 2)}\n`,
    )

    if (writeResult.kind === "ErrorResult") {
      throw new Error(writeResult.error.message)
    }

    const renameResult = await database.files.rename(temporaryPath, path)
    if (renameResult.kind === "ErrorResult") {
      await database.files.remove(temporaryPath)
      throw new Error(renameResult.error.message)
    }
  }

  function enqueueTouch<T>(value: string, task: () => Promise<T>): Promise<T> {
    const previous = touchQueues.get(value) ?? Promise.resolve()
    const next = previous.catch(() => undefined).then(task)

    touchQueues.set(value, next)
    void next.then(
      () => {
        if (touchQueues.get(value) === next) touchQueues.delete(value)
      },
      () => {
        if (touchQueues.get(value) === next) touchQueues.delete(value)
      },
    )

    return next
  }

  return {
    root,

    async list() {
      const result = await database.files.listFiles(root)
      if (result.kind === "ErrorResult") return []

      const accessTokens: Array<AccessToken> = []

      for (const fileName of result.value) {
        const accessToken = await get(fileName)
        if (accessToken !== undefined) accessTokens.push(accessToken)
      }

      return accessTokens.sort(
        (left, right) =>
          left.createdAt - right.createdAt ||
          left.value.localeCompare(right.value),
      )
    },

    get,

    async create(options = {}) {
      const now = Date.now()
      const accessToken: AccessToken = {
        value: randomBytes(32).toString("base64url"),
        createdAt: now,
        updatedAt: now,
      }

      if (options.expiredAt !== undefined) {
        accessToken.expiredAt = options.expiredAt
      }

      await put(accessToken)
      return accessToken
    },

    put,

    touch(value) {
      return enqueueTouch(value, async () => {
        const accessToken = await get(value)
        if (accessToken === undefined) return undefined

        const updated: AccessToken = {
          ...accessToken,
          updatedAt: Date.now(),
        }

        await put(updated)
        return updated
      })
    },

    async remove(value) {
      if (!isSafeTokenValue(value)) return false

      const accessToken = await get(value)
      if (accessToken === undefined) return false

      const result = await database.files.remove(accessTokenPath(value))
      if (result.kind === "ErrorResult") {
        throw new Error(result.error.message)
      }

      return true
    },
  }
}

function parseAccessToken(value: unknown): AccessToken | undefined {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return undefined
  }

  const record = value as Record<string, unknown>
  const tokenValue = record.value
  const createdAt = record.createdAt
  const updatedAt = record.updatedAt
  const expiredAt = record.expiredAt

  if (typeof tokenValue !== "string" || !accessTokenPattern.test(tokenValue)) {
    return undefined
  }

  if (typeof createdAt !== "number" || !Number.isFinite(createdAt)) {
    return undefined
  }

  if (typeof updatedAt !== "number" || !Number.isFinite(updatedAt)) {
    return undefined
  }

  if (
    expiredAt !== undefined &&
    (typeof expiredAt !== "number" || !Number.isFinite(expiredAt))
  ) {
    return undefined
  }

  const accessToken: AccessToken = {
    value: tokenValue,
    createdAt,
    updatedAt,
  }

  if (expiredAt !== undefined) {
    accessToken.expiredAt = expiredAt
  }

  return accessToken
}
