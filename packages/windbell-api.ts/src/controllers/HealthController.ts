import { z } from "zod"

import { makeAction } from "../http/makeAction.ts"
import { GetHealth } from "../services/Health.ts"

export function makeHealthController() {
  return {
    get: makeAction(z.object({}), GetHealth()),
  }
}
