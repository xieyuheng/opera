<script lang="ts">
import {
  computed,
  defineComponent,
  h,
  type CSSProperties,
  type PropType,
} from "vue"

import { createMarkdownState } from "./markdownState.ts"
import type { MarkdownNode } from "./markdownTypes.ts"
import { parseMarkdown } from "./parseMarkdown.ts"
import { createMarkdownRenderContext } from "./render/dispatch.ts"
import type {
  MarkdownEnvironment,
  MarkdownNodeRenderer,
} from "./render/types.ts"
import { createMarkdownStyle } from "./style.ts"

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

    headingAnchors: {
      type: Boolean,
      default: false,
    },
  },

  setup(props) {
    const root = computed(() => parseMarkdown(props.text))
    const ctx = computed(() =>
      createMarkdownRenderContext(createMarkdownState(root.value), {
        environment: props.environment,
        renderers: props.renderers,
        headingAnchors: props.headingAnchors,
      }),
    )

    const style = computed<CSSProperties>(() =>
      createMarkdownStyle(ctx.value.state.frontmatter),
    )

    return () => {
      return h(
        "div",
        { class: "text-ink", style: style.value },
        ctx.value.renderChildren(root.value.children),
      )
    }
  },
})
</script>
