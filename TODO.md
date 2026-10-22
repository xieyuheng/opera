- 同意 Session 页面只是隐藏，不要卸载

- 同意 移动端隐藏 ResizeDivider，不提供拖拽分栏

- Ranger 需要自己提供「关闭」按钮，
  这个按钮可以放在 header 中。

- ranger 作为二级页面，
  在宽屏幕上是左边是 sidebar 右边是 view，
  在手机上，应该改为下面是 sidebar 上面是 view。
  sidebar 在下面应该像是一个抽屉，
  点击 sidebar 的 header 可以展开和收起抽屉。

---

7. WorkspaceCreateDialog 在手机上依然固定两栏WorkspaceCreateDialog.vue:292 是 grid-cols-2，窄屏下目录列表和预览各占一半，名字很容易被截断；同时 max-h-[80vh] 加内部固定 h-64，小屏或键盘弹出时操作区可能被挤掉。建议：

* 移动端改成单列或分步选择。
* 使用 max-h-[calc(100dvh-2rem)]，让内容区可滚动。
* 目录条目单击进入，不要依赖 @dblclick。

[windbell-docs.vitepress] 改善文档
[windbell-web.vue] 利用调色板设计 theme
[semantic.ts] 文学式编程 agent interpret 和 agent loop
[windbell-docs.vitepress] 网站截图作为文档
- 截图也可用与博物馆的「风铃」页面
[windbell-web.vue] 模仿 telegram 设计纹样背景
[windbell-web.vue] 需要以更好的方式看 diff
- 最重要的是支持手机上使用
- git diff 甚至不支持中文文件名
- 可能需要 git diff 的 parser

既然我已经快速实现了 museum.vue，
应该考虑是否还需要使用 vitepress。

把 museum.vue 合并到 windbell，
把 windbell repo 改名为 opera，
opera programmatica 编程作品集。
