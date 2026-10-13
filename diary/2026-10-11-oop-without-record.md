---
title: OOP without record
author: xieyuheng
date: 2026-10-11
---

# 引

我们知道只要避免使用 class，改用 function 与 record，
我们就可以在 js/ts 中做到非常灵活的 OOP。

本文在于证明 record 其实也是不需要的。

# class vs function + record

一个函数可以通过返回一个 record 来提供多种能力，
比如在主要返回值 `events` 之外，提供 `usage`：

```typescript
const interpreter = makeInterpreter({
  model: 'deepseek/deepseek-flash',
  prompt: 'Write a short poem about the ocean.',
});

for await (const event of interpreter.events) {
  print(chunk)
}

println(await interpreter.usage())
```

可以用 class 来实现，
因为 `events` 和 `usage` 这两个能力，
可能需要一些共享的状态：

```typescript
class Interpreter {
  // ... shared state

  constructor(options) { ... }

  usage() { ... }
  events() { ... }
}
```

所谓用 function + record 代替 class，
就是用 closure 来处理这些共享的 state：

```typescript
function makeInterpreter(options) {
  // ... shared state

  function usage() { ... }
  function events() { ... }

  return {
    usage,
    events,
  }
}
```

# OOP 的本质

OOP 在于，用 object 的方式来组织代码：

- 每个 object 依赖某些能力，即构造 object 时所需要的参数；
- 每个 object 可能需要维护某些内部状态；
- 每个 object 利用所依赖的能力与维护的状态，提供一些新能力。

# 抛弃 record

基于 record 的方案，
就在于使用 record 来把所提供的新能力打包到一起。

但是完全可以不打包，不打包反而更灵活。
这就是 scalable-c 的方案，
这种方案甚至可以在 c 中使用：

- `<class>-options` -- 所依赖的能力；
- `<class>` -- 维护的内部状态；
- `<class>-<method>` -- 提供的能力。

```typescript
type Interpreter {
  // ... shared state
}

function makeInterpreter(
  options: InterpreterOptions
): Interpreter {
  ...
}

function interpreterUsage(self: Interpreter) { ... }
function interpreterEvents(self: Interpreter) { ... }
```

这样可以随时增加新能力，比「打包提供新能力」更灵活。

# 对这个例子代码的批判

这个例子完全是为了解释现象而生造的，
正确的实现方式是把 usage 作为 event 这个 ADT 的一个 variant。

# object 之间的复合

回顾 OOP 的本质：

- 依赖某些能力；
- 维护某些内部状态；
- 提供一些新能力。

通过对所依赖的能力的正规化，
可以实现 object 之间的复合。

比如 agent interpret 是带有 tool call 循环的 interpret，
它依赖于 model interpret 这种不带 tool call 循环的 interpret：

```typescript
type Model = {
  interpret: (input: Array<Sign>) ->
    Stream<ModelInterpretEvent>
}

type AgentOpitons = { model: Model }
function makeAgent(options): Agent
function agentInterpret(agent: Agent, input: Array<Sign>):
  Stream<AgentInterpretEvent>
```

而 model 可能由不同的 provider 提供：

```typescript
type DeepSeek.ModelOptions = { ... }
function DeepSeek.makeModel(options): Model

type OpenRouter.ModelOptions = { ... }
function OpenRouter.makeModel(options): Model
```

此时我们想要声明一个正规化的接口，
也就是这里的 `Model`，
这是在 OOP 中唯一需要将「能力打包」的情况。

即便如此，在具体的 provider 中，
也可以先分散实现不经打包的能力函数：

```typescript
function DeepSeek.modelInterpret(
  provider: Provider,
  input: Array<Sign>,
): Stream<ModelInterpretEvent>
```

当需要打包以返回正规化的接口时，
再使用 currying 就可以：

```typescript
function DeepSeek.makeModel(options): Model {
  return {
    interpret: (input) => ModelInterpret(provider, input),
    // ... 可能还有别的能力需要打包
  }
}
```

## 类似的写法

写 http client 的时候，也经常用到这种方式，
先分散实现，再用 currying 来打包 client 的能力。

当然，对于 http client 来收，
最好有更通用的高阶函数，
来从 API 接口生成 client 能力。

# 依赖注入

deepseek-harness [插件机制](https://deepseek-harness.github.io/deepseek-harness/develop/basic/)
就体现了「OOP 的本质」。

每个插件要用 `inject` 声明自己所依赖的其他插件：

```typescript
import type { Context } from '@deepseek-ai/cordis'

export const name = 'my-tool-plugin'
export const inject = ['tools']

export function apply(ctx: Context) {
  // ctx.tools is ready here.
  ctx.tools.register(/* ... */)
}
```

这相当于把需要在部用代码处理的日常函数，
改为了由注册机制管理的全局系统。

这个系统是全局的，所有代码都要依赖这个全局系统；
而使用模块系统与函数的日常写法是更灵活的。

# 反转

其实当我说「不用 class，用 function + record」来实现 OOP 的时候，
很多人已经不认为这是 OOP 了，更进一步让我说「record 也不用」的时候，
我自己其实也很难声称这是所谓的 OOP 了。

其实这不是 OOP，上面所描述的也不是「OOP 的本质」，
OOP 的真实本质在于「继承」，但是这是人们花了几十年才明白的坏事，
几十年之后人们才明白，不应该用「继承」的方式来组织代码。

这里所描述的是什么？
其实是更一般的「组合」与「抽象」。

所谓「组合」，就是输入所依赖能力，返回新的能力，
这与函数复合类似，只不过输入和返回的是一个能力的集合。

所谓「抽象」，就是发现实用的可以被多种方式实现的能力集合，
然后「整理、打包、命名」成为发展过程中的一个新的「符号」。

这与数学中的「抽象」等同，
数学中的抽象数学结构，比如群、环、域、向量空间，
都是实用的可以被多种方式实现的能力集合，
比如「群」，输入的是元素集合、运算、以及运算的结合律，
返回的人们针对这个接口所证明的大量定理。
在这里，所谓「实用的」，就是指就数学证明而言的经济性。

人们进一步研究数学结构之间的关系，
发展出了更抽象的范畴论。
熟悉范畴论的数学家，比如 William Lawvere，
在 "Conceptual Mathematics" 这本书中，
在证明「不动点定理」这个具体定理的时候，
甚至都可以随手抽象出来一个范畴，
代表了这个证明的过程中所依赖的能力集合。

这确实和我们在编程中所聊的是同样的事，
但是与 OOP 一点关系也没有。

反转了，其实是数学。
