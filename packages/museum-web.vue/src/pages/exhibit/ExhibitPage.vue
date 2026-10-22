<script setup lang="ts">
import { Museum } from "@xieyuheng/museum.vue"
import { computed } from "vue"
import { useRoute, useRouter } from "vue-router"

const route = useRoute()
const router = useRouter()
const contentBaseUrl = __MUSEUM_CONTENT_BASE_URL__

const name = computed(() => {
  const value = route.params.name
  return typeof value === "string" && value !== "" ? value : undefined
})

function navigate(name: string): void {
  void router.push({
    name: "exhibit",
    params: { name },
  })
}

function makeHref(name: string): string {
  return router.resolve({
    name: "exhibit",
    params: { name },
  }).href
}
</script>

<template>
  <Museum
    :content-base-url="contentBaseUrl"
    :name="name"
    :make-href="makeHref"
    @navigate="navigate"
  >
    <template #logo>
      <button>
        <span class="text-4xl font-thin">xieyuheng</span>
      </button>
    </template>
  </Museum>
</template>
