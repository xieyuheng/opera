<script setup lang="ts">
import { computed } from "vue"
import { RouterLink, type RouteLocationRaw } from "vue-router"

defineOptions({ inheritAttrs: false })

type MediumButtonVariant = "default" | "ghost" | "accent"

const props = withDefaults(
  defineProps<{
    to?: RouteLocationRaw
    type?: "button" | "submit" | "reset"
    disabled?: boolean
    active?: boolean
    variant?: MediumButtonVariant
  }>(),
  {
    type: "button",
    active: false,
    variant: "default",
  },
)

const baseClass =
  "pointer-events-auto inline-flex items-center gap-2 rounded-md border-3 px-2 py-1 transition duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"

const variantClasses = computed(() => {
  if (props.variant === "ghost") {
    return [
      "border-transparent",
      props.active
        ? "bg-sign-user/30 text-ink"
        : "bg-transparent text-ink/70 hover:bg-line/50 hover:text-ink",
    ]
  }

  if (props.variant === "accent") {
    return [
      "border-transparent text-ink",
      props.active
        ? "bg-sign-user/70"
        : "bg-sign-user/60 hover:bg-sign-user/70",
    ]
  }

  return [
    "border-line/60 text-ink backdrop-blur",
    props.active
      ? "bg-sign-user/30 hover:border-ink/25"
      : "bg-paper/30 hover:border-ink/25 hover:bg-paper/50",
  ]
})

const classes = computed(() => [
  baseClass,
  ...variantClasses.value,
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
