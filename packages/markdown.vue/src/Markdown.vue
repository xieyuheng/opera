<script lang="ts">
import { computed, defineComponent, h, type PropType } from "vue"

import { createMarkdownState } from "./markdownState.ts"
import type { MarkdownNode } from "./markdownTypes.ts"
import { parseMarkdown } from "./parseMarkdown.ts"
import { createMarkdownRenderContext } from "./render/dispatch.ts"
import type {
  MarkdownEnvironment,
  MarkdownNodeRenderer,
} from "./render/types.ts"

export default defineComponent({
  name: "Markdown",

  props: {
    text: {
      type: String,
      required: true,
    },

    environment: {
      type: Object as PropType<MarkdownEnvironment>,
      default: undefined,
    },

    renderers: {
      type: Object as PropType<
        Partial<Record<MarkdownNode["type"], MarkdownNodeRenderer>>
      >,
      default: undefined,
    },
  },

  setup(props) {
    const root = computed(() => parseMarkdown(props.text))
    const ctx = computed(() =>
      createMarkdownRenderContext(createMarkdownState(root.value), {
        environment: props.environment,
        renderers: props.renderers,
      }),
    )

    return () => {
      return h(
        "div",
        { class: "text-ink" },
        ctx.value.renderChildren(root.value.children),
      )
    }
  },
})
</script>
