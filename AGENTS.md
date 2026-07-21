# AGENTS.md

当前目录对应的是模板项目根目录。在 monorepo 研发态下，这个目录通常位于 `apps/template-react`。这里的任务目标通常是维护模板壳层、页面样例、菜单权限适配和接入文档，让业务项目可以直接拿来做起点。

## 启动顺序

Before writing code:

1. 确认当前目录是模板项目根目录；在 monorepo 中通常是 `apps/template-react`
2. 先读本文件
3. 再读 `docs/README.md`
4. 按任务类型补读对应文档
5. 读 `feature_list.json`、`progress.md`、`session-handoff.md`
6. 运行 `./init.sh`

## Startup Workflow

1. Confirm working directory is the template project root; in the monorepo it is usually `apps/template-react`
2. Read `AGENTS.md`
3. Read `docs/README.md` and task-specific docs
4. Read `feature_list.json`, `progress.md`, `session-handoff.md`
5. Run `./init.sh`

## 文档路由

- 改模板定位、范围、边界：读 `docs/PRODUCT.md`
- 改壳层、布局、主题、异常页、mock/real API 切换：读 `docs/ARCHITECTURE.md`
- 改目录组织、模块拆分、页面归类、入口约束：读 `docs/PROJECT_STRUCTURE.md`
- 改路由、菜单、权限、后端菜单树适配：读 `docs/ROUTING_AND_PERMISSIONS.md`
- 改收口、验证、接入、发布：读 `docs/RELEASE_PLAN.md`
- 改注释规范、AI 协作流程、交接方式：读 `docs/AI_WORKFLOW.md`

## 强约束

- 一次只做 `feature_list.json` 里的一个 feature，除非用户明确要求并行推进
- 收口与发布阶段必须遵守 `docs/RELEASE_PLAN.md` 的 feature 顺序，不要跳阶段推进
- 页面注册的唯一真源是 `src/app/router/routes.tsx`
- 服务端菜单模式只负责裁剪页面可见性、分组、展示名和 `permissionCodes`
- 默认不要实现“后端给什么 URL 就动态生成什么页面”
- 关键约束注释统一使用简洁中文，直接说明约束和设计意图
- 行为变化要同步更新 `README.md` 和相关 `docs/*.md`
- 改壳层、路由、菜单、权限时，同时兼顾 `local` 和 `server` 两种导航模式
- 在 `v1` 发布前不要提前扩成 CLI 生成器或运行时全动态路由平台

## One Feature At A Time

- Pick exactly one unfinished feature from `feature_list.json`
- Do not close extra scope that is not part of the active feature
- Record follow-up ideas in `progress.md` instead of implementing them by default

## 范围边界

- 当前仓库目标是“企业模板母版”，不是“组织级全动态低代码平台”
- 如果一个改动不服务于模板复用价值、接入价值或企业后台共性能力，默认不做
- 未写进当前 feature 的额外想法，记录到 `progress.md` 或 `feature_list.json`，不要顺手扩 scope

## 常用入口

- 路由注册：`src/app/router/routes.tsx`
- 服务端菜单适配：`src/app/server-menu.ts`
- 壳层布局：`src/layouts/app-shell.tsx`
- 会话持久化：`src/app/session/storage.ts`
- 请求层：`src/api/client.ts`
- mock 菜单与壳层上下文：`src/api/mock/server-menu.ts`、`src/api/mock/user-context.ts`

## 完成标准

Definition of done:

- 功能改动已经落到模板代码，而不是只写在文档里
- 至少执行一次 `./init.sh` 或等价验证命令
- `progress.md` 和 `session-handoff.md` 已更新到可接力状态
- 如果新增了约束、边界或最佳实践，已写回 `docs/`
- 没有把未纳入当前 feature 的想法一并标记为完成

## Definition of Done

- Target behavior is implemented
- Verification actually ran
- Progress and handoff files are updated
- Work stays inside the active feature boundary
- Next session can restart from `./init.sh`

## 验证命令

```bash
./init.sh
```

等价命令：

- 当前模板暂无独立 `test` 脚本；如后续补测试，必须把测试命令并入这里
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm build`

## 结束会话前

End-of-session procedure:

1. 更新 `progress.md`
2. 更新 `session-handoff.md`
3. 如有阶段性变化，更新 `feature_list.json`
4. 记录未验证项、已知风险和下一步
5. 确保下一次会话只靠 `./init.sh` 就能重新进入可工作状态

## End of Session

1. Update `progress.md`
2. Update `session-handoff.md`
3. Update `feature_list.json` if feature state changed
4. Record blockers, risks, and next step
5. Leave a clean restart path

## Clean Restart Path

- The next session should be able to start from `./init.sh`
- Do not leave the template in a state where docs and code disagree
