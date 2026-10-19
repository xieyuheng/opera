#!/usr/bin/env -S node

import process from "node:process"

import { errorReport } from "@windbell/std.ts/error"

import { makeCli } from "./cli/makeCli.ts"

try {
  await makeCli().run(process.argv.slice(2))
} catch (error) {
  console.log(errorReport(error))
  process.exit(1)
}
