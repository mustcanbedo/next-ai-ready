# 小红书发布包

目标用户：使用 Next.js App Router 的独立开发者、技术负责人和文档站维护者。

## 标题备选

1. 3 分钟给 Next.js 加上 llms.txt
2. AI 能读懂你的 Next.js 网站吗
3. Next.js 网站的 AI 可读层怎么做

封面文字：

```text
Next.js App Router
增加 llms.txt + 页面 Markdown
不改现有 UI
```

## 45 秒竖屏视频脚本

画幅：`9:16`。终端字号至少 30 px，浏览器缩放至 125%，全程隐藏个人信息。

| 时间 | 画面 | 旁白/字幕 |
| --- | --- | --- |
| 0-4 秒 | 普通 Next.js 页面，随后切到一段复杂 HTML | 你的页面对人很好看，但 AI 工具未必能稳定读取正文。 |
| 4-9 秒 | 地址栏输入 `/llms.txt`，显示接入前不存在 | 最基础的问题是：它从哪里发现内容，又如何拿到干净文本？ |
| 9-19 秒 | 终端运行 `npm create next-ai-ready@alpha next-ai-ready-demo` 和安装命令 | 我做了一个 MIT 开源工具，为 App Router 生成 AI 可读入口，不改现有 UI。 |
| 19-29 秒 | 依次打开 `/llms.txt`、`/index.md`、`/openapi.json` | 构建后可以得到站点目录、逐页 Markdown，以及可选的能力描述。 |
| 29-36 秒 | 展示 `doctor --score` 和第三方审计证据 | 它能验证技术可读性，但高分不等于一定被收录、排名或引用。 |
| 36-42 秒 | 左侧原网页，右侧 Markdown | 人看的页面继续保持原样，机器读取另一套干净输出。 |
| 42-45 秒 | 教程 URL 和 GitHub 仓库 | 完整步骤和源码放在文档里，欢迎拿真实项目来测试。 |

屏幕命令：

```bash
npm create next-ai-ready@alpha next-ai-ready-demo
cd next-ai-ready-demo
npm install
npx next-ai-ready init
npm run build
npm run dev
```

## 配套正文

很多人开始给网站补 `llms.txt`，但只放一个静态文件并不一定够。

如果是只有几个页面、很少更新的小站，手写 `public/llms.txt` 完全可以；如果是文档站、
多语言网站，或者内容经常变化，就需要让它和真实页面、摘要、Markdown 路由保持同步。

我做的 `next-ai-ready` 是一个 MIT 开源的 Next.js App Router 工具，主要做三件事：

1. 生成 `/llms.txt` 和 `/llms-full.txt`；
2. 为每个页面提供干净的 `.md` 读取入口；
3. 在确有需求时，再提供经过鉴权的 MCP 与 Agent Action。

它不会替你写好内容，也不能保证 AI 一定收录、排名或引用。它解决的是更基础的问题：让机器
能够发现并稳定读取你愿意公开的内容。

我把“什么时候手写、什么时候自动生成”、完整命令、验证方式和常见错误都整理成了中文教程：

https://next-ai-ready.vercel.app/zh/docs/guides/nextjs-llms-txt?utm_source=xiaohongshu&utm_medium=social&utm_campaign=nextjs_llms_tutorial

项目源码：

https://github.com/mustcanbedo/next-ai-ready

当前仍是 alpha，适合愿意检查生成差异并反馈真实接入问题的开发者。

## 标签

```text
#Nextjs #开源项目 #独立开发 #AI搜索 #前端开发 #网站开发
```

## 评论区置顶

```text
最小场景不需要安装任何包，直接维护 public/llms.txt 即可。教程里同时写了手动方案和自动
生成方案。正在维护 Nextra、Fumadocs 或普通 App Router 项目的朋友，可以留下内容结构和
Next.js 版本；请不要发送密钥或私有仓库内容。
```

## 发布后记录

- 24 小时：曝光、教程访问、GitHub 访问、有效技术问题。
- 7 天：实际安装、`doctor` 通过、公开部署。
- 不以点赞数或 npm 原始下载量判断产品采用。
