export type LoadableState = {
  requestId: number
  isLoading: boolean
  isPending: boolean
}

/**
 * Discard an in-flight state load before committing a local mutation.
 *
 * Route loaders refresh cached state in the background. Without this, a
 * response that was requested before the mutation can arrive afterwards and
 * overwrite the newer local state.
 */
export function cancelPendingStateLoad(state: LoadableState): void {
  state.requestId += 1
  state.isLoading = false
  state.isPending = false
}
