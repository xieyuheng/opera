<script lang="ts">
import { defineComponent, h, type PropType } from "vue"

import type { HighlightedCode } from "./highlightCode.ts"
import { renderTokens } from "./renderTokens.ts"

export default defineComponent({
  name: "MarkdownHighlightedCode",
  props: {
    tokens: {
      type: Array as PropType<HighlightedCode>,
      required: true,
    },
  },
  setup(props) {
    return () => h("code", null, renderTokens(props.tokens))
  },
})
</script>
