# 0.1 公共 API 与版本策略

本文定义 `next-ai-ready` 进入 `0.1` GA 后的兼容承诺。目标是在 `1.0`
之前仍允许产品演进，同时让已经接入的网站不会被补丁版本意外破坏。

## 公共边界

以下内容属于公共 API：

- 各发布包 `package.json` 中声明的 `exports` 入口；
- 这些入口导出的 JavaScript/TypeScript 命名符号；
- `next-ai-ready` 与 `create-next-ai-ready` 的 CLI bin、命令和已记录参数；
- 文档中公开的配置字段、Action/MCP 协议和生成路由行为。

未在 `exports` 中声明的深层路径、`src/`、内部构建产物和未记录的环境变量
均为私有实现，不提供兼容承诺。

## 0.x SemVer 规则

| 版本变化 | 允许内容 |
|---|---|
| Patch，例如 `0.1.1` | 修复、性能、文档和不改变公共行为的内部重构；不得删除或重命名公共 API |
| Minor，例如 `0.2.0` | 新功能和新的公共 API；在 `1.0` 前确需破坏性调整时，只能在 minor 中进行 |
| Major，例如 `1.0.0` 后的 `2.0.0` | 稳定期的破坏性变更 |

`0.x` 的破坏性变更必须同时具备：

1. Changeset 明确标记受影响包并说明迁移方式；
2. CHANGELOG 和升级文档记录旧写法与新写法；
3. 可行时先以 `@deprecated` 保留至少一个 minor 发布周期；
4. 至少经过一个 prerelease 标签验证后再进入 `latest`。

安全漏洞、数据损坏或外部平台强制变更可以跳过弃用周期，但发布说明必须解释原因。

## 自动基线

[`scripts/public-api-baseline.json`](../scripts/public-api-baseline.json) 是 `0.1`
发布线的机器可读基线。它锁定每个发布包的：

- export entrypoint；
- 每个 entrypoint 的命名导出；
- 每个公开 TypeScript declaration 的内容哈希，用于发现类型和签名变化；
- CLI bin 名称和目标文件。

构建后运行：

```bash
pnpm api:check
```

CI 会精确比较当前构建与基线。新增和删除都会失败，迫使维护者明确判断版本影响，
更新基线并提交 Changeset。仅仅让 TypeScript 编译通过不能替代此检查。

## 弃用流程

1. 在类型和运行时文档中标记 `@deprecated`，并给出替代 API。
2. 添加一次性迁移提示时，不得记录 token、请求正文或其他敏感数据。
3. 在 CHANGELOG 标记首次弃用版本和计划移除版本。
4. 保留旧行为到承诺周期结束，并为旧、新调用方式都保留测试。
5. 移除时更新公共 API 基线、迁移文档和对应 Changeset。

## 发布审查

每次准备发布时，维护者需要回答：

- 这个改动是否改变 export、类型签名、配置默认值、CLI 或协议行为？
- 如果改变，版本级别是否正确，是否存在迁移路径？
- `pnpm api:check`、`pnpm exports:check` 和 `pnpm pack:check` 是否全部通过？
- 实际 tarball 安装是否仍通过 npm/pnpm 与支持的 Next.js 版本矩阵？
