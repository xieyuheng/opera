import { onBeforeUnmount, onMounted, ref } from "vue"

export function useMediaQuery(query: string) {
  const matches = ref(
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia(query).matches
      : false,
  )

  let mediaQuery: MediaQueryList | undefined

  function update(event: MediaQueryListEvent): void {
    matches.value = event.matches
  }

  onMounted(() => {
    if (typeof window.matchMedia !== "function") return

    mediaQuery = window.matchMedia(query)
    matches.value = mediaQuery.matches
    mediaQuery.addEventListener("change", update)
  })

  onBeforeUnmount(() => {
    mediaQuery?.removeEventListener("change", update)
  })

  return matches
}
