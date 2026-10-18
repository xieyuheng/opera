export type ModelRef = {
  providerName: string
  name: string
}

export function formatModelRef(ref: ModelRef): string {
  return `${ref.providerName}/${ref.name}`
}
