---
title: Markdown 测试
authors: [Museum, Example]
date: 2026-10-20
---

# Markdown 功能测试

这里测试常用 Markdown 结构。

## 表格

| 功能     | 状态 |
|----------|------|
| 标题     | 支持 |
| 表格     | 支持 |
| 代码块   | 支持 |
| 相对链接 | 支持 |

## 代码块

```basic-lisp
(define (factorial n)
  (if (= n 0)
      1
      (* n (factorial (- n 1)))))
```

```
中英等宽测试|
sdasddassaas|
iiiiiiiiiiii|
λλλλλλλλλλλλ|
```

## 引用

> 导航树是策展，不是文件系统目录的自动展开。

返回 [笔记目录](index.md)，或者去看看 [线性逻辑](../topics/linear-logic.md)。
