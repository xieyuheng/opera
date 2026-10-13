---
title: exception and interface
author: xieyuheng
date: 2026-10-14
---

之前提到了 OOP 的「抽象」能力，
所依赖的能力打包成接口（interface）。

接口应该能作为我们进一步「组合」代码的边界。

对于有 exception 机制的语言来说，
接口的边界，不只包含显式声明参数类型，
还包括 throw 的 error 类型。

所以想要让接口的边界，
以简单清晰的方式记录在类型中，
就完全避免 exception，
改为把 error 当作一种可能的结果返回。
常用的是 `Result<V, E>`。
