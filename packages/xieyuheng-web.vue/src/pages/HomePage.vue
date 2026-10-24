<script setup lang="ts">
import { useHead } from "@unhead/vue"

useHead({ title: "XIEYUHENG" })
</script>

<template>
  <div class="flex h-screen flex-col dark:bg-black dark:text-white">
    <div class="flex h-full flex-col space-y-4 p-6 sm:px-10 sm:py-10">
      <div class="flex flex-wrap text-3xl font-thin">
        <div class="pr-2">XIEYUHENG</div>
      </div>

      <ul class="flex flex-col space-y-2 py-6 text-xl">
        <li class="max-w-fit hover:text-orange-500 dark:hover:text-orange-300">
          <a
            href="https://museum.xieyuheng.com"
            target="_blank"
            rel="noreferrer"
            class="flex items-center hover:underline"
          >
            <span>MUSEUM</span>
          </a>
        </li>

        <li class="max-w-fit hover:text-orange-500 dark:hover:text-orange-300">
          <a
            href="https://github.com/xieyuheng"
            target="_blank"
            rel="noreferrer"
            class="flex items-center hover:underline"
          >
            <span>GITHUB</span>
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>
