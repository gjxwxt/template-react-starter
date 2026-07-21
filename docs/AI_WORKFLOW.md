# AI Workflow

## 注释规范

关键路径统一使用简洁中文注释，直接写约束、设计意图或边界，不要加固定英文前缀。

```ts
// 这里写约束、设计意图或边界，不写重复实现描述。
```

### 什么时候必须写

- 壳层同步逻辑
- 路由 / 菜单 / 权限适配逻辑
- 会话持久化和恢复逻辑
- 请求层对企业接口约定的兼容逻辑
- mock 和真实后端共用的数据契约边界

### 什么时候不要写

- JSX 结构一眼可见的布局
- 简单变量赋值
- 只是在重复函数名含义的注释

## 改动路由

至少同步检查这些位置：

- `src/app/router/routes.tsx`
- `src/app/i18n/texts.ts`
- 需要的话补 `src/api/mock/server-menu.ts`
- 如果服务端菜单模式受影响，更新 `docs/ROUTING_AND_PERMISSIONS.md`

## 改动壳层

优先查看：

- `src/layouts/app-shell.tsx`
- `src/app/session/storage.ts`
- `src/app/config/template-config.ts`
- `src/api/client.ts`

## 改动权限

优先查看：

- `src/app/router/routes.tsx`
- `src/app/server-menu.ts`
- `src/app/permissions.ts`
- `src/api/mock/user-context.ts`

## 改收口与发布

如果当前任务目标是“收口、接入、发布、试点、RC、Stable”，先读 `docs/RELEASE_PLAN.md`。

执行约束：

- 只做 `feature_list.json` 中当前排在最前面的未完成 feature
- 不要跳过质量门禁直接去做发布文档或 CLI
- 每完成一个 release feature，都要同步更新 `feature_list.json`、`progress.md`、`session-handoff.md`
- 没跑完该 feature 要求的验证命令，不能把它标记为 done

## 验证要求

默认执行：

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm build`

如果改的是壳层、菜单、页签、主题，建议再做一次手工浏览器检查。

## 交接要求

结束前至少更新：

- `progress.md`
- `session-handoff.md`

如果阶段性能力变化明显，再更新：

- `feature_list.json`
- `README.md`
- `docs/*.md`
