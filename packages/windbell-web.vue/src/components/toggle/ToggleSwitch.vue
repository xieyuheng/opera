<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: boolean
    disabled?: boolean
  }>(),
  {
    disabled: false,
  },
)

const emit = defineEmits<{
  "update:modelValue": [value: boolean]
}>()

function handleChange(event: Event): void {
  const input = event.target as HTMLInputElement
  emit("update:modelValue", input.checked)
}
</script>

<template>
  <label
    class="inline-flex items-center gap-2"
    :class="props.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'"
  >
    <input
      class="peer sr-only"
      type="checkbox"
      :checked="props.modelValue"
      :disabled="props.disabled"
      @change="handleChange"
    />

    <span
      class="bg-line after:bg-paper peer-checked:bg-ink/80 peer-focus-visible:ring-ink relative h-5 w-9 shrink-0 rounded-full transition-colors peer-focus-visible:ring-2 after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:transition-transform after:content-[''] peer-checked:after:translate-x-4"
    />

    <span v-if="$slots.default">
      <slot />
    </span>
  </label>
</template>
