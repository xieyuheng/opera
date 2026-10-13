export type ServiceError = {
  type: string
  status: number
  message: string
  info?: Record<string, unknown>
}
