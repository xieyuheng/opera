# fs.js

下面在 fs.js 中设置 http-fs/，
用 local-fs + hono 的 api server + http clinet，
实现我们所定义的 FileSystem 接口。
（最终实现接口的其实是 http clinet）

# 学习

hono api，尤其是 hono streaming api

- 为了看懂 stream 相关的代码，从而 refactor 相关的代码

# model 接口的边界

对于有 exception 机制的语言来说，
model 接口的边界，不只包含显式声明参数类型，
还包括 throw 的 error 类型。

model 不应该把 http 相关的错误 throw 出来，
让 turn 相关的函数处理，
应该在 provider 阶段就处理好所有的错误类型，
把错误归一化，作为 event 发出来。

---

关于能力边界的笔记。

# usage

目前我们的 agent interpret 只是返回一个 stream，
而 vercel 的 `streamText` 返回的是一个 `StreamTextResult`：

```typescript
const result = streamText({
  model: 'deepseek/deepseek-flash',
  prompt: 'Write a short poem about the ocean.',
});

for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}
```

返回 object，object 的 method 之间可以共享 state。
返回一组函数，多个函数之间可以通过闭包来共享 state。

我们是否要通过这种方式来支持 usage？
或者说，我们应该通过给 agent interpret 增加 callback 来支持 usage？

不对，这是 clinet 的设计，
api 本身必须用 event stream 来实现。
也就是把 usage 相关的信息作为 event 在 stream 中返回。

# semiosis-api.js

refactor makeSemiosisRouter.ts

- learn about hono/streaming

# 文学式编程

给出 agent interpret 和 agent loop 和 markdown 文学式编程

# windbell-web.js

改空内容时的样式。

- 比如 工作区没有对话。

利用调色板设计 theme

修复 markdown code block 所使用的背景颜色

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
