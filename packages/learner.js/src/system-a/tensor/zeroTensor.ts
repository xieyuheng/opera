import { repeatApply } from "../../utils/repeatApply.ts"
import type { Shape } from "./shape.ts"
import type { Tensor } from "./Tensor.ts"

export function zeroTensor(shape: Shape): Tensor {
  if (shape.length === 0) return 0

  const [length, ...restShape] = shape
  return repeatApply(length, zeroTensor, [restShape])
}
