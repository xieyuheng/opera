---
title: git and session database
author: xieyuheng
date: 2026-10-07
---

由于我们用纯文本保存 markdown 类的 session。
所以自然想到用 git 管理整个 ~/.windbell/database 文件夹。

经过一段时间尝试用 git 管理数据库，使用起来非常方便。

- 方便多个电脑同步数据。
- 有历史记录，和备份，不用担心数据丢失。
- 在 web app 上的对话与操作，都是对数据库的修改。
  如果某段修改是不想要的，可以直接用 git reset 来 undo。

未来可以考虑设计 git-api.js（类似 fs-api.js），
来惯例本地部署的 git。
