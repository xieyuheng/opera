import { windbell } from "../../app/windbell"
import { modelEntryContextWindow } from "@windbell/semiosis.js/core"
import type * as S from "@windbell/semiosis.js/core"
import { reactive } from "vue"

export type SessionActiveTurn = {
  turnId: string
  input: string
  signs: Array<S.Sign>
  partialSign?: S.Sign
}

function appendSignDelta(
  partialSign: S.Sign | undefined,
  delta: S.SignDelta,
): S.Sign {
  const content =
    partialSign?.kind === delta.signKind && "content" in partialSign
      ? partialSign.content
      : ""

  return {
    kind: delta.signKind,
    content: content + delta.content,
  }
}

export type SessionState = {
  sessionId: S.SessionId
  workspaceId: S.WorkspaceId
  workspaceRoot: string
  title: string
  context: Array<S.Sign>
  activeTurn: SessionActiveTurn | undefined
  modelRef: S.ModelRef | undefined
  contextWindow: number | undefined
  latestUsage: S.ModelUsage | undefined
  totalUsage: S.ModelTotalUsage | undefined
  hasLoaded: boolean
  isLoading: boolean
  isPending: boolean
  requestId: number
  interpreting: boolean
  error: string | undefined
  errorRetryable: boolean
  errorInputPersisted: boolean
}

const maxInterpretAttempts = 3
const retryDelaysMs = [500, 1_000, 2_000]

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError
}

export function makeSessionState(sessionId: S.SessionId): SessionState {
  return reactive<SessionState>({
    sessionId,
    workspaceId: "",
    workspaceRoot: "",
    title: "",
    context: [],
    activeTurn: undefined,
    modelRef: undefined,
    contextWindow: undefined,
    latestUsage: undefined,
    totalUsage: undefined,
    hasLoaded: false,
    isLoading: true,
    isPending: false,
    requestId: 0,
    interpreting: false,
    error: undefined,
    errorRetryable: false,
    errorInputPersisted: false,
  })
}

const sessionStates = new Map<S.SessionId, SessionState>()
const interpretationControllers = new Map<S.SessionId, AbortController>()

function clearSessionError(state: SessionState): void {
  state.error = undefined
  state.errorRetryable = false
  state.errorInputPersisted = false
}

function commitActiveTurn(state: SessionState): void {
  if (state.activeTurn === undefined) return

  state.context.push(...state.activeTurn.signs)
  state.activeTurn = undefined
}

function beginActiveTurn(
  state: SessionState,
  content: string,
  turnId?: string,
): SessionActiveTurn {
  const id = turnId ?? `turn-${crypto.randomUUID()}`

  if (state.activeTurn?.turnId === id) {
    state.activeTurn.input = content
    return state.activeTurn
  }

  if (state.activeTurn !== undefined && state.errorInputPersisted) {
    commitActiveTurn(state)
  }

  state.activeTurn = {
    turnId: id,
    input: content,
    signs: [],
  }

  return state.activeTurn
}

async function readSessionModelRef(): Promise<S.ModelRef> {
  const settings = await windbell.settings.get()
  const providerName = settings.defaultProvider

  if (providerName === null) {
    throw new Error("default provider is not configured")
  }

  const providerConfig = await windbell.providers.get(providerName)

  if (providerConfig === undefined) {
    throw new Error(`provider not found: ${providerName}`)
  }

  if (providerConfig.defaultModel === null) {
    throw new Error(`default model is not configured: ${providerName}`)
  }

  return {
    providerName: providerConfig.name,
    name: providerConfig.defaultModel,
  }
}

async function resolveSessionModel(state: SessionState): Promise<S.ModelRef> {
  const modelRef = await readSessionModelRef()

  if (
    state.modelRef?.providerName === modelRef.providerName &&
    state.modelRef.name === modelRef.name &&
    state.contextWindow !== undefined
  ) {
    return modelRef
  }

  const entry = await windbell.providers.getModel({
    providerName: modelRef.providerName,
    modelName: modelRef.name,
  })
  const contextWindow = modelEntryContextWindow(entry)

  if (contextWindow === undefined) {
    throw new Error(
      `model context window unavailable: ${modelRef.providerName}/${modelRef.name}`,
    )
  }

  state.modelRef = modelRef
  state.contextWindow = contextWindow
  return modelRef
}

async function refreshUsage(state: SessionState): Promise<void> {
  const usage = await windbell.sessions.getUsage({
    sessionId: state.sessionId,
  })

  state.totalUsage = usage.totalUsage
  state.latestUsage = usage.latestUsage
}

export function cancelSessionInterpretation(state: SessionState): void {
  interpretationControllers.get(state.sessionId)?.abort()
}

export function getSessionState(sessionId: S.SessionId): SessionState {
  let state = sessionStates.get(sessionId)

  if (state === undefined) {
    state = makeSessionState(sessionId)
    sessionStates.set(sessionId, state)
  }

  return state
}

export async function loadSessionState(
  state: SessionState,
  sessionId: S.SessionId,
): Promise<void> {
  const requestId = ++state.requestId
  state.sessionId = sessionId

  if (state.hasLoaded) {
    state.isPending = true
  } else {
    state.isLoading = true
  }

  clearSessionError(state)

  try {
    const data = await windbell.pages.loadSessionData({ sessionId })

    if (requestId !== state.requestId) return

    state.workspaceId = data.session.workspaceId
    state.title = data.session.title
    state.context = data.session.context
    state.activeTurn = undefined
    state.workspaceRoot = data.workspace.root
    state.hasLoaded = true

    await resolveSessionModel(state)
    await refreshUsage(state)
  } catch (error) {
    if (requestId !== state.requestId) return

    state.error = error instanceof Error ? error.message : String(error)
  } finally {
    if (requestId === state.requestId) {
      state.isLoading = false
      state.isPending = false
    }
  }
}

async function runInterpretAttempt(options: {
  state: SessionState
  activeTurn: SessionActiveTurn
  modelRef: S.ModelRef
  input: S.UserSign
  signal: AbortSignal | undefined
}): Promise<boolean> {
  const { state, activeTurn, modelRef, input, signal } = options

  try {
    for await (const event of windbell.sessions.interpret({
      sessionId: state.sessionId,
      model: modelRef,
      turnId: activeTurn.turnId,
      input: [input],
      signal,
    })) {
      if (event.type === "error") {
        state.error = event.message
        state.errorRetryable = event.retryable
        state.errorInputPersisted = event.inputPersisted
        return event.retryable
      }

      if (event.type === "usage") {
        state.latestUsage = event.usage
        continue
      }

      if (event.type === "delta") {
        activeTurn.partialSign = appendSignDelta(
          activeTurn.partialSign,
          event.delta,
        )
        continue
      }

      activeTurn.signs.push(event.sign)

      if (
        event.sign.kind === "ReasoningSign" ||
        event.sign.kind === "AssistantSign"
      ) {
        if (activeTurn.partialSign?.kind === event.sign.kind) {
          activeTurn.partialSign = undefined
        }
      }
    }

    return false
  } catch (error) {
    if (signal?.aborted) return false

    const retryable = isNetworkError(error)

    state.error = error instanceof Error ? error.message : String(error)
    state.errorRetryable = retryable
    return retryable
  }
}

async function runActiveTurnWithRetries(options: {
  state: SessionState
  activeTurn: SessionActiveTurn
  modelRef: S.ModelRef
  input: S.UserSign
  signal: AbortSignal | undefined
}): Promise<boolean> {
  const { state, activeTurn, modelRef, input, signal } = options

  for (let attempt = 1; attempt <= maxInterpretAttempts; attempt += 1) {
    activeTurn.signs = []
    activeTurn.partialSign = undefined

    const shouldRetry =
      (await runInterpretAttempt({
        state,
        activeTurn,
        modelRef,
        input,
        signal,
      })) && attempt < maxInterpretAttempts

    if (!shouldRetry) {
      if (state.error !== undefined) {
        return false
      }

      commitActiveTurn(state)
      clearSessionError(state)
      return true
    }

    const delayMs = retryDelaysMs[attempt - 1] ?? retryDelaysMs.at(-1) ?? 0
    await delay(delayMs)
  }

  return false
}

export async function interpretSession(
  state: SessionState,
  content: string,
  options: { signal?: AbortSignal; turnId?: string } = {},
): Promise<boolean> {
  state.interpreting = true
  clearSessionError(state)

  const controller =
    options.signal === undefined ? new AbortController() : undefined
  const signal = options.signal ?? controller?.signal

  if (controller !== undefined) {
    interpretationControllers.set(state.sessionId, controller)
  }

  try {
    const modelRef = await resolveSessionModel(state)

    const input: S.UserSign = {
      kind: "UserSign",
      content,
    }
    const activeTurn = beginActiveTurn(state, content, options.turnId)

    const success = await runActiveTurnWithRetries({
      state,
      activeTurn,
      modelRef,
      input,
      signal,
    })
    await refreshUsage(state)
    return success
  } catch (error) {
    if (signal?.aborted) return false

    state.error = error instanceof Error ? error.message : String(error)
    state.errorRetryable = false
    return false
  } finally {
    if (
      controller !== undefined &&
      interpretationControllers.get(state.sessionId) === controller
    ) {
      interpretationControllers.delete(state.sessionId)
    }

    if (state.activeTurn !== undefined) {
      state.activeTurn.partialSign = undefined
    }

    state.interpreting = false
  }
}

export async function retrySessionInterpretation(
  state: SessionState,
): Promise<boolean> {
  if (state.activeTurn === undefined || state.interpreting) return false

  return await interpretSession(state, state.activeTurn.input, {
    turnId: state.activeTurn.turnId,
  })
}

export function editSessionInterpretation(
  state: SessionState,
): string | undefined {
  if (state.activeTurn === undefined || state.errorInputPersisted) {
    return undefined
  }

  const input = state.activeTurn.input
  state.activeTurn = undefined
  clearSessionError(state)
  return input
}

export function dismissSessionError(state: SessionState): void {
  commitActiveTurn(state)
  clearSessionError(state)
}

export async function generateSessionTitle(state: SessionState): Promise<void> {
  if (state.modelRef === undefined) return

  try {
    const title = (
      await windbell.sessions.generateTitle({
        sessionId: state.sessionId,
        model: state.modelRef,
      })
    ).trim()

    if (title !== "") {
      state.title = title
    }
  } catch {
    // Title generation is best-effort and should not block the conversation.
  }
}
