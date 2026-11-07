import { shape } from "./shape.ts"
import { type Tensor } from "./Tensor.ts"

export function rank(t: Tensor): number {
  return shape(t).length
}
