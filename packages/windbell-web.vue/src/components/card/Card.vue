<script setup lang="ts">
import { computed, type Component } from "vue"

const props = withDefaults(
  defineProps<{
    as?: string | Component
    color?: string
    overflow?: "clip" | "visible"
  }>(),
  {
    as: "div",
    color: "var(--color-line)",
    overflow: "clip",
  },
)

const bodyOverflowClass = computed(() =>
  props.overflow === "visible" ? "overflow-visible" : "overflow-clip",
)
</script>

<template>
  <component
    :is="props.as"
    class="block"
    :style="{ '--card-color': props.color }"
  >
    <div v-if="$slots.tag" class="flex min-w-0">
      <div
        class="flex min-w-0 overflow-hidden rounded-t-lg border-2 border-[var(--card-color)] bg-[var(--card-color)] px-3 py-0.5"
      >
        <slot name="tag" />
      </div>

      <div class="card-tag-corner mr-3" aria-hidden="true"></div>
    </div>

    <div
      class="border-2 border-[var(--card-color)]"
      :class="[
        $slots.tag ? 'rounded-tr-lg rounded-b-lg' : 'rounded-lg',
        bodyOverflowClass,
      ]"
    >
      <slot />

      <footer
        v-if="$slots.footer"
        class="border-t-3 border-dotted border-[var(--card-color)] px-3 py-1"
      >
        <slot name="footer" />
      </footer>
    </div>
  </component>
</template>

<style scoped>
.card-tag-corner {
  align-self: flex-end;
  flex-shrink: 0;
  width: 0.5rem;
  height: 0.5rem;
  pointer-events: none;
  background: radial-gradient(
    circle at 100% 0,
    transparent 0,
    transparent calc(0.5rem - 1px),
    var(--card-color) 0.5rem
  );
}
</style>
