# Claude Code 实施提示词

> **最后更新：** 2026-06-01（alpha.4 bump 完成；待 npm publish）

---

## 主提示词（发布 alpha.4）

```
你是 next-ai-ready monorepo 的 implementer。本地版本 0.1.0-alpha.4（9 包已对齐），npm `@alpha` 仍为 alpha.3。

## 任务

用户将执行 `pnpm publish:alpha`。你已完成 verify:release 的前提下，只需：

1. 确认 `grep -r "0.1.0-alpha.4" packages/*/package.json` 9 包一致
2. 若用户要求你 publish — 提醒需要 Granular Token（Bypass 2FA），不要粘贴 token
3. 发布后更新 docs/backlog.md E-03、completion-audit npm 行

## 已完成

P0～PR-7 + alpha.4 bump + e2e-smoke doctor + bin-smoke + CI release checks。

## 用户发布命令

```bash
cd /Users/jair/codes/next-ai-ready
pnpm verify:release    # 可选预检
pnpm publish:alpha     # 需 npm config token
npm view next-ai-ready dist-tags
```

## 发布后 /tmp 验收

见 docs/external-quickstart-verification.md 手动步骤。
```

---

## P2 后续（可选）

- E-04：`pnpm changeset` + `pnpm version` 走通一次
- T-02：Doctor noai meta 检测
- R-07：`next-ai-ready dev` watch
