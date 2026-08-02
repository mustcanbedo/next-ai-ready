# 发布回滚手册

本手册覆盖 `next-ai-ready` 的三个独立发布状态：npm 包、Git 源码和 Vercel
文档站。它们必须分别记录和验证，不能把“网页已回滚”当成“SDK 已回滚”。

## 触发条件

出现以下任一情况时停止继续发布并开始回滚评估：

- 新用户无法完成安装、`init`、`build` 或 `doctor`；
- 支持的 Next.js 版本生产构建失败；
- 公共 API 或生成路由发生未声明的破坏；
- 线上文档站持续 5xx、核心 AI 资源不可读或官方 Readability 低于 100；
- Action/MCP 出现越权、敏感数据泄露或不可逆调用风险。

先记录事件时间、坏 commit、坏 npm 版本、坏 Vercel deployment URL，以及最后
已知良好的对应值。不要删除旧部署或发布标签，它们是恢复和审计依据。

## 1. 先恢复线上文档站

生产站故障时，先恢复流量，再调查原因：

```bash
vercel logs --environment production --status-code 5xx --since 30m
vercel rollback
vercel rollback status
```

Vercel Hobby 计划只能回到上一个生产部署；Pro/Enterprise 才能指定更早的部署：

```bash
vercel rollback <known-good-deployment-url>
```

回滚后验证：

```bash
curl -fsS https://next-ai-ready.vercel.app/llms.txt >/dev/null
curl -fsS https://next-ai-ready.vercel.app/sitemap.md >/dev/null
pnpm exec agent-readability audit https://next-ai-ready.vercel.app/en --min-score 100
```

Instant Rollback 会暂停生产域名自动指派。修复版本验证通过后，必须显式 promote
以恢复正常部署行为：

```bash
vercel promote <fixed-deployment-url>
vercel promote status
```

参考：[Vercel rollback CLI](https://vercel.com/docs/cli/rollback)、
[Vercel 生产回滚指南](https://vercel.com/docs/deployments/rollback-production-deployment)。

## 2. 恢复 npm 安装入口

npm 已发布版本不可覆盖。对每个受影响包分别执行以下动作：

1. 确认坏版本和最后已知良好版本确实存在；
2. 精确 deprecate 坏版本，不要使用宽泛版本范围；
3. 将受影响的 `latest` 或 `alpha` dist-tag 指回良好版本；
4. 验证 tag 和精确版本；
5. 尽快发布带修复的新 patch，而不是长期依赖旧 tag。

先生成只读计划：

```bash
pnpm rollback:plan -- \
  --package next-ai-ready \
  --bad 0.1.0 \
  --good 0.1.0-alpha.12 \
  --tag latest
```

计划器只打印命令，不会连接 npm 或修改 dist-tag。负责人逐行核对后再手工执行。
如果一次发布影响多个包，必须为每个包分别生成计划；不能只移动 meta 包而遗留
不兼容的 scoped 依赖。需要 2FA 时由 npm CLI 请求 OTP 或安全密钥验证，不把凭据
写入命令、日志或仓库。

参考：[npm dist-tag](https://docs.npmjs.com/cli/commands/npm-dist-tag)、
[npm deprecate](https://docs.npmjs.com/cli/commands/npm-deprecate)。

## 3. 恢复 Git 主线

已推送或已发布的历史使用 revert，不强推、不重写 `main`，也不删除对应 release tag：

```bash
git fetch origin
git switch -c codex/rollback-<incident-id> origin/main
git revert --no-edit <bad-commit>
pnpm verify:release
git push -u origin codex/rollback-<incident-id>
```

通过 PR 合入回滚提交。若坏版本已经发布，Git 回滚不会让 npm 用户自动降级，仍需
完成第 2 节的 registry 动作并发布新的修复版本。

## 4. 回滚后验证

必须同时验证源码、registry 和线上状态：

```bash
pnpm build
pnpm test
pnpm typecheck
pnpm api:check
pnpm pack:check
PNPM_VIA_COREPACK=1 PACKAGE_SOURCE=registry REGISTRY_TAG=<restored-tag> pnpm external:smoke
```

然后复查线上 `llms.txt`、`sitemap.md`、Markdown negotiation、Agent Markdown
缺页恢复、MCP 鉴权和官方 Vercel Readability 100 分。将结果、执行人、时间、命令
输出摘要和后续修复版本记录到 incident 或 release 说明中。

## 5. 前滚与关闭事件

1. 从回滚后的主线修复根因并增加能复现事故的回归测试。
2. 发布 prerelease，跑 npm/pnpm × Next.js 14/15/16 外部安装矩阵。
3. 发布新的 patch，不能复用坏版本号。
4. 部署并验证固定版本，再用 `vercel promote` 恢复生产自动指派。
5. 确认 npm tag、Git commit、Vercel deployment 三者指向同一已验证发布状态。

GA 前至少演练一次“只生成 npm 计划 + Vercel 状态查看 + Git revert dry run”，不实际
修改 npm tag 或生产域名。
