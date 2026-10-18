import * as Readline from "node:readline"

export async function readLine(prompt: string): Promise<string | undefined> {
  const readline = Readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  try {
    return await new Promise<string | undefined>((resolve) => {
      let settled = false

      readline.question(prompt, (value) => {
        settled = true
        resolve(value)
      })

      readline.once("close", () => {
        if (!settled) resolve(undefined)
      })
    })
  } finally {
    readline.close()
  }
}
