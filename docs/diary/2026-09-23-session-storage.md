---
title: Session 的保存方式
author: xieyuheng
assistant: deepseek
date: 2026-09-23
---

# Session 的保存方式

Session 以目录形式保存在：

```text
~/.windbell/database/sessions/<session-id>/
```

每个 Session 目录包含：

```text
<session-id>/
  index.json
  context/
```

## index.json

`index.json` 保存 Session 级别的元数据，不保存完整 signs：

- `id`
- `workspaceId`
- `title`
- `model.qualifiedName`
- `createdAt`
- `updatedAt`

## context

`context/` 中一个 sign 一个文件。

文件名由两部分组成：

```text
NNNN-<sign-type-name>.<ext>
```

- `NNNN` 是长度为 4 的序号，从 `0000` 开始，
  如果长度超过 4 了，就翻倍为 8 `NNNNNNNN`；
- `<sign-type-name>` 是 sign 类型名；
- `<ext>` 是 `.md` 或 `.json`；
- 按文件名字典序即可还原 sign 顺序。

类型名映射：

| Sign             | 文件名        | 扩展名  |
|------------------|---------------|---------|
| `PersonaSign`    | `persona`     | `.md`   |
| `UserSign`       | `user`        | `.md`   |
| `ReasoningSign`  | `reasoning`   | `.md`   |
| `AssistantSign`  | `assistant`   | `.md`   |
| `ErrorSign`      | `error`       | `.md`   |
| `ToolSign`       | `tool`        | `.json` |
| `ToolCallSign`   | `tool-call`   | `.json` |
| `ToolOutputSign` | `tool-output` | `.json` |

例如：

```text
context/
  0000-persona.md
  0001-user.md
  0002-reasoning.md
  0003-assistant.md
  0004-tool-call.json
  0005-tool-output.json
```

约定：

- sign 类型由文件名决定；
- `.md` 文件的正文是 sign 的文本内容；
- `.json` 文件保存完整的 sign 对象；
- `.json` 中仍保留 `kind` 字段，便于文件自包含。
