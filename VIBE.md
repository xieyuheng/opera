# windbell-web.js

利用调色板设计 theme

修复 markdown code block 所使用的背景颜色

# 文学式编程

给出 agent interpret 和 agent loop 和 markdown 文学式编程

# windbell-web.js

下面我们设计 usage 的 web ui，
在使用 ai agent 时，关于 usage，
我主要想看到的是现在使用 token 所占的百分比。

我计划用类似游戏中的血条 UI 来展示这个百分比。

- 「血条」在返回按钮上面（可能需要调整 SessionToolbar 的结构）
- 「血条」用一定的固定的长度代表 1m 上下文大小。

问题：

- 我们用什么方式从不同 provider 提供的 model 信息中，
  取出上下文 token 上限？

# windbell-web.js

模仿 telegram 给对话设页面以及其他页面置纹样背景。

# IDE and meta-lisp

必要的功能：

- 语法高亮

可能不必要的功能：

- 初始化项目模板

通过悬浮按钮来支持的功能：

- 快速运行 scripts/ 中的脚本。
- 快速输入 prompts/ 中保存的 prompts。
- 检查当前 git diff。
