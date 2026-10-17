- 保持历史 token 一直有效，这个没问题。这样旧 token 还能用，不用每次都从带有 token 的 url 打开，很麻烦。
  如果后台管理有需要，可以手动清除 token，或者 token 文件内部，用 json 字段保存创建时间。
  这样之后可以设计到期机制。
- 

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
