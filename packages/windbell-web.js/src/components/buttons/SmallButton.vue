<script setup lang="ts">
import { computed } from "vue"
import { RouterLink, type RouteLocationRaw } from "vue-router"

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    to?: RouteLocationRaw
    type?: "button" | "submit" | "reset"
    disabled?: boolean
  }>(),
  {
    type: "button",
  },
)

const baseClass =
  "inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-sm text-ink transition-colors hover:bg-line"
const classes = computed(() => [
  baseClass,
  props.to !== undefined && props.disabled === true
    ? "pointer-events-none opacity-50"
    : "disabled:pointer-events-none disabled:opacity-50",
])
</script>

<template>
  <RouterLink
    v-if="props.to !== undefined"
    v-bind="$attrs"
    :class="classes"
    :to="props.to"
    :aria-disabled="props.disabled === true ? 'true' : undefined"
  >
    <slot />
  </RouterLink>

  <button
    v-else
    v-bind="$attrs"
    :class="classes"
    :type="props.type"
    :disabled="props.disabled"
  >
    <slot />
  </button>
</template>
