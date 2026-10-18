---
title: Cache 前缀与 response schema
author: xieyuheng
assistant: deepseek
date: 2026-10-04
---

# 动机

实现 provider client 时，我们一开始把 response schema 写得很严格，
希望所有字段都必须显式声明，否则直接报错。

想法是：这样就不会有“未建模字段偷偷影响 cache”的情况。

但实际跑 DeepSeek 和 OpenRouter 之后很快发现，
上游 API 会不断增加字段。
如果我们对 response schema 使用 strict validation，
上游一加字段，我们的程序就会直接失败。

这显然是不可接受的。

# Prompt cache 到底依赖什么

Prompt cache 命中，依赖的是：

```text
我们上一次实际发给 provider 的 request 前缀
```

也就是说：

```text
request = signToMessages(context)
```

Provider 缓存的是 `request` 的前缀。

下一轮时：

```text
context' = context + newSigns
request' = signToMessages(context')
```

只要：

```text
request' 的前面部分 === request
```

cache 就会命中。

因此 cache 稳定性真正依赖的是：

- `signToMessages` 是确定性的；
- sign 是 append-only 的。

它并不依赖：

```text
provider response 必须完全无损地保存下来
```

# 为什么 response 多字段不影响 cache

Provider response 中多出来的字段，如果从不进入 signs：

```text
provider response extra fields
  -> 不进入 sign
  -> 不进入下一轮 request
  -> 不改变 cache 前缀
```

例如：

- `id`
- `created`
- `usage`
- `system_fingerprint`
- `benchmarks`
- `alias_target`

这些字段不影响我们重建 assistant message，
所以在 response schema 中即使被忽略，也不会影响 cache。
