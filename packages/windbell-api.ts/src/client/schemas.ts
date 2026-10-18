import { z } from "zod"

export function JsonDataSchema<T>(): z.ZodType<T> {
  return z.custom<T>(() => true)
}

export const VoidSchema: z.ZodType<void> = z
  .null()
  .transform((): void => undefined)
