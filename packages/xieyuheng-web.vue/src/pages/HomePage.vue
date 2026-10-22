<script setup lang="ts">
import { useHead } from "@unhead/vue"

import EnvelopeIcon from "../components/icons/EnvelopeIcon.vue"
import GithubIcon from "../components/icons/GithubIcon.vue"

useHead({
  title: "谢宇恒",
  meta: [
    {
      name: "description",
      content: "Xie Yuheng's Homepage",
    },
  ],
})
</script>

<template>
  <div class="flex h-screen flex-col dark:bg-black dark:text-white">
    <div class="flex h-full flex-col space-y-4 p-6 sm:px-10 sm:py-10">
      <div class="flex flex-wrap text-2xl font-bold">
        <div class="pr-2">谢宇恒</div>
        <div class="pr-2">/</div>
        <div class="pr-2">Xie Yuheng</div>
      </div>

      <div class="flex flex-wrap text-2xl">
        <div>A programmer.</div>
      </div>

      <ul class="flex flex-col space-y-2 py-6 text-xl">
        <li class="max-w-fit hover:text-orange-500 dark:hover:text-orange-300">
          <a
            href="https://github.com/xieyuheng"
            target="_blank"
            rel="noreferrer"
            class="flex items-center hover:underline"
            title="my github homepage"
          >
            <GithubIcon class="mr-3 h-6 w-6 shrink-0" />
            <span>xieyuheng</span>
          </a>
        </li>

        <li class="max-w-fit hover:text-orange-500 dark:hover:text-orange-300">
          <a
            href="mailto:xyheme@gmail.com"
            target="_blank"
            rel="noreferrer"
            class="flex items-center hover:underline"
            title="my email"
          >
            <EnvelopeIcon class="mr-3 h-6 w-6 shrink-0" />
            <span>xyheme@gmail.com</span>
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>
