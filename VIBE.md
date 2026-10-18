# semiosis.js

为什么会有这个报错：

```sh

  xyh@lattice /home/xyh/windbell (master) [1]
$ semiosis repl --session session-3a5dfa02-24ec-4309-ab5c-5705ab6b6282
semiosis.js 0.1.0

session workspace mismatch: session-3a5dfa02-24ec-4309-ab5c-5705ab6b6282 belongs to workspace-85045c79-8338-41da-bb40-9a9a4e3050ab
```

对于已有 workspace 的 session，不应该再重新创建 workspace。

数据如下：

{
  "id": "session-3a5dfa02-24ec-4309-ab5c-5705ab6b6282",
  "workspaceId": "workspace-85045c79-8338-41da-bb40-9a9a4e3050ab",
  "title": "未命名",
  "createdAt": 1792255532808,
  "updatedAt": 1792255666074
}


{
  "id": "workspace-85045c79-8338-41da-bb40-9a9a4e3050ab",
  "name": "windbell",
  "root": "/home/xyh/windbell",
  "createdAt": 1790168852332,
  "updatedAt": 1792255666074
}

# windbell-web.js

[windbell-web.js] 利用调色板设计 theme

# 文学式编程

给出 agent interpret 和 agent loop 和 markdown 文学式编程

# windbell-web.js

模仿 telegram 给对话设页面以及其他页面置纹样背景。

# IDE and meta-lisp

必要的功能：

- 语法高亮

通过悬浮按钮来支持的功能：

- 快速运行 scripts/ 中的脚本。
- 快速输入 prompts/ 中保存的 prompts。
- 检查当前 git diff。
