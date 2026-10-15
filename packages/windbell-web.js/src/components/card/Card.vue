<script setup lang="ts">
import type { Component } from "vue"

const props = withDefaults(
  defineProps<{
    as?: string | Component
    color?: string
  }>(),
  {
    as: "div",
    color: "var(--color-line)",
  },
)
</script>

<template>
  <component
    :is="props.as"
    class="block"
    :style="{ '--card-color': props.color }"
  >
    <div v-if="$slots.tag" class="flex">
      <div
        class="flex py-0.5 border-2 border-[var(--card-color)] rounded-t-lg bg-[var(--card-color)] px-3"
      >
        <slot name="tag" />
      </div>

      <div class="card-tag-corner" aria-hidden="true"></div>
    </div>

    <div
      class="border-2 border-[var(--card-color)]"
      :class="$slots.tag ? 'rounded-b-lg rounded-tr-lg' : 'rounded-lg'"
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
