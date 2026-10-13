import { z } from "zod"
import type { Json, JsonObject } from "@windbell/std.js/json"
import type {
  FileSystemEntry,
  FileSystemError,
  FileType,
} from "../../fs/index.ts"
import type { Result } from "@windbell/std.js/result"
import { decodeBase64 } from "@windbell/std.js/base64"

const JsonValueSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonValueSchema),
    z.record(z.string(), JsonValueSchema),
  ]),
)

const JsonObjectSchema: z.ZodType<JsonObject> = z.record(
  z.string(),
  JsonValueSchema,
)

export const PathStyleSchema = z.enum(["posix", "win32"])

export const FileSystemPlatformSchema = z.object({
  name: z.string(),
  pathStyle: PathStyleSchema,
})

export const FileSystemStatSchema = z.object({
  kind: z.enum(["File", "Directory"]),
  size: z.number(),
  mtimeMs: z.number(),
})

export const FileSystemErrorSchema: z.ZodType<FileSystemError> = z.object({
  type: z.string(),
  who: z.string(),
  message: z.string(),
  info: JsonObjectSchema.optional(),
})

export const ErrorResultSchema = z.object({
  kind: z.literal("ErrorResult"),
  error: FileSystemErrorSchema,
})

export function ResultSchema<T>(
  value: z.ZodType<T>,
): z.ZodType<Result<T, FileSystemError>> {
  return z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("OkResult"), value }),
    z.object({ kind: z.literal("ErrorResult"), error: FileSystemErrorSchema }),
  ]) as z.ZodType<Result<T, FileSystemError>>
}

export const StringSchema = z.string()

export const BooleanSchema = z.boolean()

export const StringListSchema = z.array(z.string())

export const VoidSchema: z.ZodType<void> = z
  .null()
  .transform((): void => undefined)

export const FileTypeSchema: z.ZodType<FileType> = z.enum([
  "text",
  "image",
  "pdf",
  "archive",
  "binary",
  "unknown",
])

export const FileSystemEntrySchema: z.ZodType<FileSystemEntry> = z.object({
  name: z.string(),
  path: z.string(),
  kind: z.enum(["File", "Directory"]),
})

export const FileSystemEntryListSchema: z.ZodType<Array<FileSystemEntry>> =
  z.array(FileSystemEntrySchema)

export const Base64BytesSchema: z.ZodType<Uint8Array> = z
  .string()
  .transform((value) => decodeBase64(value))

export function ResultRecordSchema<T>(
  value: z.ZodType<T>,
): z.ZodType<Record<string, Result<T, FileSystemError>>> {
  return z.record(z.string(), ResultSchema(value))
}
