import type { MaybePromise } from "@windbell/std.ts/promise"
import type { Result } from "@windbell/std.ts/result"
import type * as S from "@windbell/semiosis.ts"
import type { z } from "zod"
import { serviceErrorStatus } from "./serviceErrorStatus.ts"

export type MakeActionOptions = {
  status?: number
}

export function makeAction<Input, Output>(
  schema: z.ZodType<Input>,
  service: (input: Input) => MaybePromise<Result<Output, S.ServiceError>>,
  options: MakeActionOptions = {},
): (input: unknown) => Promise<Response> {
  return async (input) => {
    const parsed = await schema.safeParseAsync(input)

    if (!parsed.success) {
      return Response.json(
        {
          error: {
            type: "input-validation-error",
            message: parsed.error.message,
            info: {
              issues: parsed.error.issues,
            },
          },
        },
        { status: 400 },
      )
    }

    try {
      const result = await service(parsed.data)

      if (result.kind === "ErrorResult") {
        return Response.json(
          {
            error: {
              type: result.error.type,
              message: result.error.message,
              info: result.error.info,
            },
          },
          { status: serviceErrorStatus(result.error) },
        )
      }

      if (result.value instanceof Response) {
        return result.value
      }

      if (options.status === 204) {
        return new Response(null, { status: 204 })
      }

      return Response.json(result.value ?? null, {
        status: options.status ?? 200,
      })
    } catch (error) {
      return Response.json(
        {
          error: {
            type: "internal-error",
            message: error instanceof Error ? error.message : String(error),
          },
        },
        { status: 500 },
      )
    }
  }
}
