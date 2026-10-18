<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { themeColorTokens, type Theme } from "../../app/theme.ts"
import Card from "../../components/card/Card.vue"
import { themeListMessages } from "./ThemeList.i18n.ts"

const props = defineProps<{
  theme: Theme
}>()

const emit = defineEmits<{
  select: []
}>()

const { t } = useI18n({
  messages: themeListMessages,
  useScope: "local",
})

const themeModes = ["light", "dark"] as const
</script>

<template>
  <Card as="article" class="cursor-pointer" @click="emit('select')">
    <template #tag>
      <h2 class="truncate">{{ props.theme.name }}</h2>
    </template>

    <div class="flex flex-col gap-3 px-3 py-2">
      <div class="flex flex-wrap items-center gap-2" @click.stop>
        <slot name="toolbar" />
      </div>

      <div class="flex flex-col gap-2">
        <div
          v-for="mode in themeModes"
          :key="mode"
          class="flex items-center gap-2"
        >
          <span class="shrink-0">
            {{ t(mode) }}
          </span>

          <div
            class="flex min-w-0 flex-1 overflow-hidden rounded border border-line"
          >
            <span
              v-for="token in themeColorTokens"
              :key="token"
              class="h-5 min-w-0 flex-1"
              :style="{ backgroundColor: props.theme.colors[mode][token] }"
              :title="`--color-${token}`"
            />
          </div>
        </div>
      </div>
    </div>
  </Card>
</template>
