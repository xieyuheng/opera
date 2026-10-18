import * as Readline from "node:readline"
import process from "node:process"
import type {
  Repl,
  ReplCommand,
  ReplInputHandler,
  ReplInputResult,
} from "../repl/Repl.ts"

export function makeTtyRepl(): Repl {
  const input = process.stdin
  const output = process.stdout

  const isInteractive = input.isTTY === true
  const useBracketedPaste = isInteractive && output.isTTY === true
  const useColor =
    output.isTTY === true &&
    process.env.NO_COLOR === undefined &&
    process.env.TERM !== "dumb"

  const commands = new Map<string, ReplCommand>()
  const messages: Array<string> = []
  const buffer: Array<string> = []
  const cancelHandlers = new Set<() => void>()

  let lastKey: Readline.Key | undefined = undefined
  let isPasting = false
  let isClosed = false
  let isInputEnded = false
  let isCleanedUp = false
  let pendingResolve: ((result: ReplInputResult) => void) | undefined

  function println(message: string): void {
    output.write(`${message}\n`)
  }

  function registerCommand(command: ReplCommand): void {
    commands.set(command.name, command)
  }

  function listCommands(): Array<ReplCommand> {
    return [...commands.values()]
  }

  function onCancel(handler: () => void): () => void {
    cancelHandlers.add(handler)

    return () => {
      cancelHandlers.delete(handler)
    }
  }

  function onKeypress(_str: string, key: Readline.Key): void {
    lastKey = key

    // Bracketed paste lets multi-line pasted text bypass line submission.
    if (key.name === "paste-start") {
      isPasting = true
    }

    if (key.name === "paste-end") {
      isPasting = false
    }
  }

  function onLine(line: string): void {
    const shouldContinue = isInteractive && (isPasting || isNewlineKey(lastKey))
    lastKey = undefined
    buffer.push(line)

    if (shouldContinue) return

    const input = buffer.join("\n")
    buffer.length = 0
    deliver(input)
  }

  function onClose(): void {
    isInputEnded = true
    cleanup()
    resolvePending()
  }

  function cleanup(): void {
    if (isCleanedUp) return
    isCleanedUp = true

    input.off("keypress", onKeypress)

    if (useBracketedPaste) {
      output.write("\x1b[?2004l")
    }

    readline.close()
  }

  function resolvePending(): void {
    const resolve = pendingResolve
    pendingResolve = undefined
    resolve?.({ kind: "end" })
  }

  function deliver(input: string): void {
    if (pendingResolve !== undefined) {
      const resolve = pendingResolve
      pendingResolve = undefined
      resolve({ kind: "input", input })
      return
    }

    messages.push(input)
  }

  async function tryDispatchCommand(input: string): Promise<boolean> {
    const parsed = parseCommandLine(input)
    if (parsed === undefined) return false

    if (parsed.type === "unknown") {
      println(`unknown command: ${parsed.raw}`)
      return true
    }

    const command = commands.get(parsed.name)
    if (command === undefined) {
      println(`unknown command: ${input.trimStart().trimEnd()}`)
      return true
    }

    await command.handler({
      command: parsed.name,
      input: parsed.input,
    })

    return true
  }

  function readInput(prompt: string): Promise<ReplInputResult> {
    if (isClosed) return Promise.resolve({ kind: "end" })

    if (messages.length > 0) {
      if (!isInputEnded) {
        readline.setPrompt(prompt)
        readline.prompt()
      }

      return Promise.resolve({
        kind: "input",
        input: messages.shift() as string,
      })
    }

    if (isInputEnded) return Promise.resolve({ kind: "end" })

    readline.setPrompt(prompt)
    readline.prompt()

    return new Promise((resolve) => {
      pendingResolve = resolve
    })
  }

  async function run(onInput: ReplInputHandler, prompt: string): Promise<void> {
    try {
      while (true) {
        const result = await readInput(prompt)
        if (result.kind === "end") break

        const input = result.input
        const normalized = input.trim()
        if (normalized === "") continue

        const handled = await tryDispatchCommand(input)
        if (handled) continue

        await onInput(normalized)
      }
    } finally {
      close()
    }
  }

  function close(): void {
    if (isClosed) return

    isClosed = true
    cleanup()
    resolvePending()
  }

  if (isInteractive) {
    // Register keypress before createInterface, otherwise readline emits
    // the line event before we can inspect the terminating key.
    Readline.emitKeypressEvents(input)
    input.on("keypress", onKeypress)
  }

  const readline = Readline.createInterface({ input, output })
  readline.on("line", onLine)
  readline.on("close", onClose)
  readline.on("SIGINT", () => {
    if (cancelHandlers.size === 0) {
      close()
      return
    }

    // - why: not call close(). Ctrl-C should cancel the current operation
    //   and keep the REPL alive, so the user can decide what to do next.
    for (const handler of cancelHandlers) {
      handler()
    }
  })

  if (useBracketedPaste) {
    output.write("\x1b[?2004h")
  }

  return {
    useColor,
    println,
    registerCommand,
    listCommands,
    tryDispatchCommand,
    readInput,
    run,
    onCancel,
    close,
  }
}

type ParsedCommandLine =
  | {
      type: "command"
      name: string
      input: string
    }
  | {
      type: "unknown"
      raw: string
    }

function parseCommandLine(input: string): ParsedCommandLine | undefined {
  if (input.includes("\n")) return undefined

  const trimmedStart = input.trimStart()
  if (!trimmedStart.startsWith("/")) return undefined

  const raw = trimmedStart.trimEnd()
  const content = trimmedStart.slice(1)
  const whitespaceIndex = content.search(/\s/)

  if (whitespaceIndex === -1) {
    if (content === "") {
      return { type: "unknown", raw }
    }

    return {
      type: "command",
      name: content,
      input: "",
    }
  }

  const name = content.slice(0, whitespaceIndex)
  if (name === "") {
    return { type: "unknown", raw }
  }

  return {
    type: "command",
    name,
    input: content.slice(whitespaceIndex + 1),
  }
}

function isNewlineKey(key: Readline.Key | undefined): boolean {
  if (key === undefined) return false

  // Ctrl+J and pasted newlines are LF, while Enter is usually CR.
  if (key.sequence === "\n") return true

  // Alt+Enter is usually ESC + Enter, which readline reports as meta.
  if (key.name === "enter" && key.meta === true) return true
  if (key.name === "return" && key.meta === true) return true

  return false
}
