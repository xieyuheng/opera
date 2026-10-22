<script setup lang="ts">
import { useRoute } from "vue-router"

const route = useRoute()
</script>

<template>
  <div class="flex max-w-[43rem] flex-col gap-6 p-3 sm:p-8">
    <header class="flex flex-col items-start gap-8 sm:flex-row">
      <h1>
        <RouterLink :to="{ name: 'exhibit' }">
          <span class="text-4xl font-thin">xieyuheng</span>
        </RouterLink>
      </h1>
    </header>

    <main class="flex flex-col gap-4">
      <p>没有这个页面。</p>

      <pre
        class="border-ink/30 bg-ink/5 overflow-x-auto rounded border p-3 font-mono text-sm"
        >{{ route.fullPath }}</pre>

      <p>
        <RouterLink
          :to="{ name: 'exhibit' }"
          class="underline underline-offset-2"
        >
          回到博物馆
        </RouterLink>
      </p>
    </main>
  </div>
</template>
