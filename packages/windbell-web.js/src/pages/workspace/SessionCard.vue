<script setup lang="ts">
import { Pencil, Trash2 } from "@lucide/vue"
import type * as S from "@windbell/semiosis.js"
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { RouterLink } from "vue-router"
import Card from "../../components/card/Card.vue"
import SmallButton from "../../components/buttons/SmallButton.vue"
import { formatDateTime } from "../../utils/datetime/index.ts"
import SignLine from "../../components/sign/SignLine.vue"

const props = withDefaults(
  defineProps<{
    session: S.Session
    previewLimit?: number
  }>(),
  {
    previewLimit: 3,
  },
)

const emit = defineEmits<{
  trash: []
  updateTitle: [title: string]
}>()

const { t } = useI18n({
  messages: {
    "zh-CN": {
      colon: "：",
      updatedAt: "更新于",
      createdAt: "创建于",
      editTitle: "修改标题",
      trash: "移入对话回收站",
      editTitlePrompt: "输入新的对话标题",
      trashConfirm: "确定将这个对话移入回收站吗？之后可以从回收站恢复。",
    },
    "en-US": {
      colon: ":\u00a0",
      updatedAt: "Updated at",
      createdAt: "Created at",
      editTitle: "Edit title",
      trash: "Move session to dustbin",
      editTitlePrompt: "Enter a new session title",
      trashConfirm:
        "Move this session to the dustbin? You can restore it later.",
    },
  },
  useScope: "local",
})

const sessionRoute = computed(() => ({
  name: "session",
  params: {
    sessionId: props.session.id,
  },
}))

const previewSigns = computed(() => {
  const signs = props.session.context
  const limit = Math.max(0, props.previewLimit)

  return signs.slice(Math.max(0, signs.length - limit))
})

function requestEditTitle(): void {
  const title = window.prompt(t("editTitlePrompt"), props.session.title)
  if (title === null) return

  const nextTitle = title.trim()
  if (nextTitle === "" || nextTitle === props.session.title) return

  emit("updateTitle", nextTitle)
}

function requestTrash(): void {
  if (!window.confirm(t("trashConfirm"))) return

  emit("trash")
}
</script>

<template>
  <Card as="article">
    <template #tag>
      <RouterLink class="block min-w-0" :to="sessionRoute">
        <h2 class="truncate">
          {{ session.title }}
        </h2>
      </RouterLink>
    </template>

    <div class="flex flex-col gap-2 px-3 py-2">
      <div class="flex items-center gap-2">
        <SmallButton type="button" @click="requestEditTitle">
          <Pencil :size="16" :stroke-width="1.5" aria-hidden="true" />
          <span>{{ t("editTitle") }}</span>
        </SmallButton>

        <SmallButton type="button" @click="requestTrash">
          <Trash2 :size="16" :stroke-width="1.5" aria-hidden="true" />
          <span>{{ t("trash") }}</span>
        </SmallButton>
      </div>

      <RouterLink class="block" :to="sessionRoute">
        <ol v-if="previewSigns.length > 0" class="flex flex-col gap-1">
          <SignLine
            v-for="(sign, index) in previewSigns"
            :key="index"
            :sign="sign"
          />
        </ol>
      </RouterLink>
    </div>

    <template #footer>
      <div class="flex flex-col gap-1 text-sm">
        <p class="truncate">
          {{ t("updatedAt") }}{{ t("colon")
          }}{{ formatDateTime(session.updatedAt) }}
        </p>
        <p class="truncate">
          {{ t("createdAt") }}{{ t("colon")
          }}{{ formatDateTime(session.createdAt) }}
        </p>
      </div>
    </template>
  </Card>
</template>
