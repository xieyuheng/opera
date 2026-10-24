<script setup lang="ts">
import { useHead } from "@unhead/vue"
import { useRoute } from "vue-router"

const route = useRoute()

useHead({ title: "404" })
</script>

<template>
  <div class="h-screen dark:bg-black dark:text-white">
    <div class="flex flex-col space-y-2 p-3">
      <div class="text-xl font-bold">没有这个页面</div>

      <div class="overflow-x-auto font-mono text-sm">{{ route.fullPath }}</div>
    </div>
  </div>
</template>
