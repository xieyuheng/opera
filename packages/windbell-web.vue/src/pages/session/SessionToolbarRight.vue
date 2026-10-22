<script setup lang="ts">
import { Menu, X } from "@lucide/vue"
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"

import MediumButton from "../../components/buttons/MediumButton.vue"
import { sessionMessages } from "./Session.i18n.ts"
import type { SignDisplayMode } from "./sessionSignDisplayMode.ts"

const props = defineProps<{
  rangerOpen: boolean
  nextSignDisplayMode: SignDisplayMode
}>()

const emit = defineEmits<{
  back: []
  toggleRanger: []
  cycleSignDisplayMode: []
}>()

const { t } = useI18n({
  messages: sessionMessages,
  useScope: "local",
})

const mobileMenuOpen = ref(false)

const nextSignDisplayLabel = computed(() => {
  switch (props.nextSignDisplayMode) {
    case "expand":
      return t("signDisplayExpand")
    case "digest":
      return t("signDisplayDigest")
    case "overview":
      return t("signDisplayOverview")
  }
})
</script>

<template>
  <div class="relative flex flex-col items-end gap-2">
    <button
      type="button"
      class="text-sign-user pointer-events-auto inline-flex cursor-pointer items-center justify-center border-0 bg-transparent p-0 sm:hidden"
      :title="mobileMenuOpen ? t('closeMenu') : t('openMenu')"
      :aria-label="mobileMenuOpen ? t('closeMenu') : t('openMenu')"
      :aria-expanded="mobileMenuOpen"
      aria-controls="session-toolbar-right-menu"
      @click="mobileMenuOpen = !mobileMenuOpen"
    >
      <X v-if="mobileMenuOpen" class="size-7" aria-hidden="true" />
      <Menu v-else class="size-7" aria-hidden="true" />
    </button>

    <div
      id="session-toolbar-right-menu"
      class="absolute top-full right-0 z-50 mt-2 w-max flex-col gap-2 sm:static sm:mt-0 sm:flex sm:w-auto sm:flex-row"
      :class="mobileMenuOpen ? 'flex' : 'hidden'"
    >
      <div class="flex items-center">
        <MediumButton type="button" @click="emit('back')">
          <span>{{ t("app.back") }}</span>
        </MediumButton>
      </div>

      <MediumButton
        type="button"
        :title="nextSignDisplayLabel"
        @click="emit('cycleSignDisplayMode')"
      >
        <span>{{ nextSignDisplayLabel }}</span>
      </MediumButton>

      <div class="flex items-center">
        <MediumButton
          type="button"
          :active="props.rangerOpen"
          :aria-pressed="props.rangerOpen"
          :title="props.rangerOpen ? t('closeRanger') : t('openRanger')"
          @click="emit('toggleRanger')"
        >
          <span>
            {{ props.rangerOpen ? t("closeRanger") : t("openRanger") }}
          </span>
        </MediumButton>
      </div>
    </div>
  </div>
</template>
