export type SignState = {
  workspaceRoot?: string
  streaming?: boolean
}

export function createSignState(options: SignState = {}): SignState {
  return {
    workspaceRoot: options.workspaceRoot,
    streaming: options.streaming,
  }
}
