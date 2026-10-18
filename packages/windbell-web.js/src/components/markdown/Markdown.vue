<script lang="ts">
import { computed, defineComponent, h } from "vue"
import { createMarkdownState } from "./markdownState.ts"
import { parseMarkdown } from "./parseMarkdown.ts"
import { createMarkdownRenderContext } from "./render/dispatch.ts"

export default defineComponent({
  name: "Markdown",

  props: {
    text: {
      type: String,
      required: true,
    },
  },

  setup(props) {
    const root = computed(() => parseMarkdown(props.text))
    const ctx = computed(() =>
      createMarkdownRenderContext(createMarkdownState(root.value)),
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
