---
layout: home
hero:
  name: 风铃
  text: 智能体
  tagline: |
    受到皮尔士符号学启发的智能体；
    极简主义，只有一个 shell 工具；
    本地网页应用，支持手机操作电脑。
---

> * 思维不是一个封闭的内在过程，\
>   而是一个符号解释的过程，\
>   每一个思想都是一个符号，\
>   它指向另一个符号，\
>   如此无限延伸。
> * 人的思想就是符号的连续解释过程。
> * 人即符号。
>
> -- 皮尔士

<br />

[[toc]]

## 引子

下面我将用最直白，最不绕弯子的方式，向你介绍「风铃」编程智能体是什么。

其实就是用一堆我自己日常使用过程中的截图，来介绍「风铃」的功能。

这种介绍方式最真实。

## 对话

首先最日常的就是「对话页面」（Session Page）。

下面两个截图是一个完成了的对话页面。

对话开始部分：

- 「工具」是智能体所能使用的工具。在 Linux 上只有 `bash`。
- 「人设」告诉智能体应该扮演什么角色，是所谓「系统提示词」。
- 「用户」是我发出的信息，描述了我想要完成的编程任务。

![](./images/2026-10-23--11-45-06.png){data-zoomable}

对话结束部分：

- 「工具调用」是智能体想要在机器上调用 `bash` 来运行的命令。
- 「工具输出」是 `bash` 命令的输出。
- 「思考」智能体的思考过程。
- 「助手」任务完成之后，智能体对我的答复。

![](./images/2026-10-23--11-44-45.png){data-zoomable}

### 血条

对话页面的左上角是智能体的「血条」。

- 代表当前可以使用的「剩余上下文空间」。
- 一点血代表 1K 词元。
- 这里的 DeepSeek 有 1000 多点血上限，就是 1M 词元的上下文上限。
- 上下文用尽的时候，这场对话就 "game over" 了。

### 小地图

对话页面最右边的彩色一条是「小地图」。

- 对应对话页面中符号的颜色与位置。
- 鼠标在小地图上滑动，可以快速定位到某个符号卡片。

### 展开、摘要、概览

对话页面有三种模式。

上面两张截图是默认的「展开」模式，
所有「符号」（Sign）卡片都展开。

点击右上工具栏中的「摘要」按钮，
可以进入「摘要」模式：

- 除了「用户」和「助手」这两种符号展开，其他符号卡片都收起来成一行。

![](./images/2026-10-23--13-46-55.png){data-zoomable}

在「摘要」状态下，点击右上工具栏中的「概览」按钮，
可以进入「概览」模式：

- 所有符号卡片都收起。

![](./images/2026-10-23--13-49-05.png){data-zoomable}

### 巡察

点击右上工具栏中的「巡察」按钮，可以打开文件查看器。

点击「巡闭」按钮，可以关闭。

![](./images/2026-10-23--14-01-17.png){data-zoomable}

### 统计

左上工具栏中，有两个统计信息类的按钮。

「累积用量」：

- 每一步与语言大模型对话，都需要把所有上下文发送给大模型。
- 而上下文本身就是在不断累积的，
  所以这里的「累积用量」是一个递增数列的加和。
- 类似于 1 + 2 + 3 + 4 + 5 + ... + n，
  其数值最终可能远远大于 n 这个「血上限」。

![](./images/2026-10-23--14-09-14.png){data-zoomable}

「轮次列表」：

- 一个「轮次」（Turn）是一轮由「用户」输入信息发起的「工具调用」循环。
- 列表中的「轮次」是可以点击的，点击可以跳到对应的符号卡片。

![](./images/2026-10-23--14-09-34.png){data-zoomable}

### 手机上的对话

对话页面的是最常用的主要页面，
所以很多细节都为手机做了专门的适配。

![](./images/photo_1_2026-10-23_14-58-00.jpg){.screenshot data-zoomable}
![](./images/photo_2_2026-10-23_14-58-00.jpg){.screenshot data-zoomable}
![](./images/photo_3_2026-10-23_14-58-00.jpg){.screenshot data-zoomable}

![](./images/photo_4_2026-10-23_14-58-00.jpg){.screenshot data-zoomable}
![](./images/photo_5_2026-10-23_14-58-00.jpg){.screenshot data-zoomable}
![](./images/photo_7_2026-10-23_14-58-00.jpg){.screenshot data-zoomable}

## 主次

对话页面为「主要页面」，其他页面都为「次要页面」。

有些是为了引导我进入主要页面，有些辅助性的配置页面。

对于这些次要页面，
我想要一个「设计语言」来辅助 UI 设计。

「设计」在于选择，所谓「设计语言」就在于把选择规范化，
把连续的选择变离散，并减少可选择的分支。

- 正如 LISP 的语法框架，
  可以帮助我在设计语言时，
  避免浪费时间在语法选择上。
- 正如「偏正」结构之类的汉语构词法，
  可以帮助我选择函数和类型的名字。

### 卡片

在主要页面，我们已经在用不同类型的卡片来代表符号了。

可以把「卡片」这个设计元素推广，成为卡片式设计语言：

- 在一个页面中，可以展示卡片的列表。
- 一个卡片可以视为是一个更深层页面的「缩略图」，
  点击卡片可以进入这个更深层页面。
- 这样页面和卡片之间的关系救能形成一个「页面树」。
- 一个卡片也可能不是缩略图。
  也就是说为信息紧凑，「页面树」中的叶子节点也可以以卡片的形式出现。

## 首页

「首页」包含多个「工作区卡片」：

![](./images/2026-10-24--06-42-39.png){data-zoomable}

在「首页」可以新建「工作区」：

![](./images/2026-10-24--06-43-31.png){data-zoomable}

「首页」在手机上的截图：

![](./images/photo_2_2026-10-24_06-47-36.jpg){.screenshot data-zoomable}
![](./images/photo_1_2026-10-24_06-47-36.jpg){.screenshot data-zoomable}
![](./images/photo_3_2026-10-24_06-47-36.jpg){.screenshot data-zoomable}

## 工作区

「工作区页面」有多个「对话卡片」：

![](./images/2026-10-24--07-00-15.png){data-zoomable}

在「工作区页面」的输入框，可以开启新对话：

- 支持按「回车」编辑多行文本。

![](./images/2026-10-24--07-03-34.png){data-zoomable}

「工作区页面」在手机上的截图：

![](./images/photo_1_2026-10-24_07-10-06.jpg){.screenshot data-zoomable}
![](./images/photo_2_2026-10-24_07-10-06.jpg){.screenshot data-zoomable}
![](./images/photo_3_2026-10-24_07-10-06.jpg){.screenshot data-zoomable}

## 设置

从「首页」点击「设置」按钮，可以进入「设置页面」：

- 可以选择「语言」「颜色模式」「字体」等等。

![](./images/2026-10-24--07-13-05.png){data-zoomable}

从「设置页面」点击「提供商与模型」：

- 可以配置 API key 以及默认模型。

![](./images/2026-10-24--07-13-27.png){data-zoomable}

从「设置页面」点击「主题列表」：

![](./images/2026-10-24--07-13-41.png){data-zoomable}

在具体的「主题页面」可以配置主题的配色，并且实时看到配色效果：

![](./images/2026-10-24--07-13-52.png){data-zoomable}

设置相关的页面在手机上的截图：

![](./images/photo_1_2026-10-24_07-20-27.jpg){.screenshot data-zoomable}
![](./images/photo_2_2026-10-24_07-20-27.jpg){.screenshot data-zoomable}
![](./images/photo_3_2026-10-24_07-20-27.jpg){.screenshot data-zoomable}
![](./images/photo_4_2026-10-24_07-20-27.jpg){.screenshot data-zoomable}

## 源代码

我采用 [基于源代码](https://github.com/xieyuheng/opera) 的方式发布软件。

因为在 AI 的时代，这有很多好处：

- 方便 AI 智能体在使用软件过程中阅读源码。
- 每个用户都可以利用 AI 智能体修改源码。

```sh
git clone https://github.com/xieyuheng/opera
```

在我电脑上的源代码目录：

```sh
  /home/xyh/projects/xieyuheng/opera (master)
$ ll
total 264K
-rw-rw-r--  1 xyh xyh   11 Oct 19 02:47 AUTHORS
drwxrwxr-x  2 xyh xyh 4.0K Oct 23 00:02 bin/
drwxr-xr-x  3 xyh xyh 4.0K Oct 23 04:02 docs/
drwxr-xr-x  2 xyh xyh 4.0K Oct 19 02:47 installers/
-rw-rw-r--  1 xyh xyh  35K Oct 19 02:47 LICENSE
drwxrwxr-x  3 xyh xyh 4.0K Oct 24 21:15 node_modules/
drwxrwxr-x 20 xyh xyh 4.0K Oct 23 00:00 packages/
-rw-rw-r--  1 xyh xyh 185K Oct 24 21:15 pnpm-lock.yaml
-rw-rw-r--  1 xyh xyh  227 Oct 20 20:26 pnpm-workspace.yaml
-rw-rw-r--  1 xyh xyh  260 Oct 24 21:15 README.md
drwxrwxr-x  2 xyh xyh 4.0K Oct 24 21:15 scripts/
-rw-rw-r--  1 xyh xyh  688 Oct 25 01:04 TODO.md
```

`scripts/` 中有很多工具性脚本。

先运行「准备」与「构建」脚本：

```sh
scripts/prepare.sh
scripts/build.sh
```

可执行文件脚本保存在：

```sh
bin/windbell
```

启动 windbell 服务：

```sh
$ bin/windbell start --expose --qr-code
```

终端输出日志中包含使用信息：

```sh
[2026-10-24 22:57:00] [windbell start] local (IPv4): http://127.0.0.1:4090/?token=XXXXXX
[2026-10-24 22:57:00] [windbell start] exposed (IPv4, wlp0s20f3): http://192.168.5.28:4090/?token=XXXXXX

#
# 二维码
#

```

- 打开本地网址 `http://127.0.0.1:4090/?token=...` 就可以使用。
- `--expose` 参数代表把服务暴露在局域网中：
  `http://192.168.5.28:4090/?token=...`。
  - 这个地址可以在局域网中用手机访问。
  - 所谓「局域网」就是说电脑和手机连接同一个 wifi。
- `--qr-code` 代表在终端中打印 `--expose` 的网址的二维码，方便手机扫码使用。
  - 注意：「微信扫码」和「支付宝扫码」不行，
    因为它们不会调用手机的浏览器。
    - 安卓手机推荐使用 [BinaryEye](https://github.com/markusfisch/BinaryEye) 扫码。

软件运行时的数据，会以文件的形式保存在：

```sh
~/.opera
- var/
  - windbell/
    - database/
      - settings.json
      - providers/
      - sessions/
      - themes/
      - workspaces/
```

### 用 git 管理数据库

我自己会使用一个远程的私有 git 仓库，
来备份 `~/.opera/var/windbell/database`
这个数据库：

```sh
  /home/xyh/.opera/var/windbell/database (master)
$ cat .git/config
[core]
    repositoryformatversion = 0
    filemode = true
    bare = false
    logallrefupdates = true

[remote "origin"]
    url = git@github.com:xieyuheng/windbell-database.git
    fetch = +refs/heads/*:refs/remotes/origin/*

[branch "master"]
    remote = origin
    merge = refs/heads/master
```

注意：

- 使用**私有**仓库。
- 另外，我会在 `.gitignore` 文件中加入：
  ```
  .secrets/
  ```
  避免 API key 被记录在 git 中。

用 git 管理数据库的好处是：

- 有远程备份。
- 随时回退到之前的对话。
- 方便在不同的电脑之间同步。

### 安装脚本

另外，仓库中提供了两个安装脚本：

```sh
installers/install.sh   # bash (linux)
installers/install.ps1  # powershell (windows)
```

比如在 Linux 上，会安装在 `~/.opera` 路径下：

```sh
~/.opera
- lib/          # 所依赖的程序
  - node/
  - npm/
  - pnpm/
- bin/
  - windbell*   # 可执行文件
- libexec/
- src/
  - opera/      # 源代码仓库的克隆
- tmp/
- var/
  - windbell/
    - database/ # 用文件系统实现的数据库
      - settings.json
      - providers/
      - sessions/
      - themes/
      - workspaces/
```

### 手机远程访问

#### 方案 A

如果你有自己的域名，或者愿意注册一个自己的域名。

可以使用方案 A：

- 用 cloudflare 管理域名。
- 在本地启动 windbell 服务。
- 使用 cloudflare 隧道，将本地服务通过自己的域名暴露到公网。

此时的网络效果是：

```
手机 -[访问自己的域名]-> cloudflare 服务器 -[隧道]-> 本地服务
```

方案的具体实施细节，你可以问 AI。

#### 方案 B

如果你在家里，那么你的电脑会拥有一个 ipv6 公网地址。

可以使用方案 B：

- 设置光猫与路由器，使得 ipv6 入站流量不被阻拦。
- 在本地启动 windbell 服务时带上 `--ipv6` 参数使用 ipv6 地址。

此时的网络效果是：

```
手机 -[访问自己 ipv6 地址]-> 本地服务
```

由于本地的 ipv6 地址是网络运营商动态分配给你的，
所以地址可能会变化。

为了解决这个问题，如果有自己的域名，
可以配合 [ddclient](https://github.com/ddclient/ddclient) 使用。

这也需要自己的域名，但是不经过隧道的直接 ipv6 连接速度更快。

## 多余的话

关于风铃智能体，
我还有一些多余的话。

讨论智能体与皮尔士符号学之间的关系，
放在我的个人主页中了：

- <https://museum.xieyuheng.com/exhibits/风铃>
