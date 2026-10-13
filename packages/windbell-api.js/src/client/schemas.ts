import { z } from "zod"

export function JsonDataSchema<T>(): z.ZodType<T> {
  return z.custom<T>(() => true)
}

export const VoidSchema = z
  .null()
  .transform((): void => undefined) as unknown as z.ZodType<void>
