import { z } from "zod"
import { ModelInfoSchema } from "./ModelInfoSchema.ts"

export const ModelListSchema = z.object({
  object: z.literal("list"),
  data: z.array(ModelInfoSchema),
})

export type ModelList = z.infer<typeof ModelListSchema>
