import type {
  FileSystemEntry,
  FileSystemError,
  FileSystemErrorType,
  FileType,
} from "@windbell/fs.ts/fs"
import type { Json, JsonObject } from "@windbell/std.ts/json"
import type { Result } from "@windbell/std.ts/result"
import { z } from "zod"

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

const fileSystemErrorTypes = [
  "aborted",
  "not-found",
  "permission-denied",
  "read-only",
  "already-exists",
  "directory-not-empty",
  "busy",
  "not-a-directory",
  "not-a-file",
  "is-a-directory",
  "invalid-path",
  "no-space",
  "too-many-open-files",
  "cross-device",
  "too-many-symbolic-links",
  "http-error",
  "invalid-response",
  "unknown",
] as const satisfies readonly FileSystemErrorType[]

export const FileSystemErrorTypeSchema = z.enum(fileSystemErrorTypes)

export const FileSystemErrorSchema = z.object({
  type: FileSystemErrorTypeSchema,
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
  ])
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
