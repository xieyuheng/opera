<script setup lang="ts">
import { useColorMode, type ColorModePreference } from "../../app/color-mode.ts"

const colorMode = useColorMode()

const colorModeOptions: Array<{
  value: ColorModePreference
  label: string
  description: string
}> = [
  {
    value: "system",
    label: "跟随系统",
    description: "根据操作系统的外观设置自动切换浅色或深色。",
  },
  {
    value: "light",
    label: "浅色",
    description: "始终使用浅色背景和深色文字。",
  },
  {
    value: "dark",
    label: "深色",
    description: "始终使用深色背景和浅色文字。",
  },
]
</script>

<template>
  <main class="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-4">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-xl font-semibold">设置</h1>

      <RouterLink
        :to="{ name: 'exhibit' }"
        class="border-line hover:bg-line rounded-md border-2 px-2 py-1 text-sm transition-colors"
      >
        返回博物馆
      </RouterLink>
    </header>

    <section class="border-line rounded-lg border-2">
      <header class="border-line border-b-2 px-3 py-2">
        <h2 class="font-semibold">颜色模式</h2>
        <p class="mt-1 text-sm">选择博物馆页面使用的浅色或深色外观。</p>
      </header>

      <div
        class="flex flex-col gap-1 p-2"
        role="radiogroup"
        aria-label="颜色模式"
      >
        <label
          v-for="item in colorModeOptions"
          :key="item.value"
          class="hover:bg-line flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 transition-colors"
        >
          <input
            class="accent-ink mt-1"
            type="radio"
            name="color-mode"
            :value="item.value"
            :checked="colorMode.preference === item.value"
            @change="colorMode.setPreference(item.value)"
          />

          <span class="flex flex-col gap-0.5">
            <span>{{ item.label }}</span>
            <span class="text-ink/70 text-sm">{{ item.description }}</span>
          </span>
        </label>
      </div>

      <p class="border-line text-ink/70 border-t-2 px-3 py-2 text-sm">
        当前显示：{{ colorMode.resolved === "dark" ? "深色" : "浅色" }}
      </p>
    </section>
  </main>
</template>
