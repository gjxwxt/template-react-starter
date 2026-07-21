# Session Progress Log

## Current State

**Last Updated:** 2026-07-20
**Active Focus:** `release-integration-ready`

## What's Done

- [x] 模板已经具备登录、壳层、页签、主题、异常页等母版能力
- [x] 路由与权限已定为“本地路由注册 + 服务端菜单裁剪”的混合模式
- [x] 已补 `AGENTS.md`、`AGENT.md`、`docs/`、`feature_list.json`、`session-handoff.md`、`init.sh`
- [x] 关键代码路径已统一补充简洁中文注释
- [x] 已补齐用户、角色、部门、字典四类系统管理样例页
- [x] 按钮级 `permissionCodes` 已接入关键系统管理操作区
- [x] 已把收口、验证、接入、发布阶段计划写入 `docs/RELEASE_PLAN.md`
- [x] 已把发布阶段拆成可执行 feature，并固化到 `feature_list.json`
- [x] 完成 `release-quality-gate`，引入 Playwright 并集成到 `init.sh`
- [x] 完成 `release-permission-closure`，修补权限漏绑/错绑，明确按钮权限可选，补齐任务/资产详情接入点，同步多角色 mock
- [x] 已补模板目录拆分设计文档，明确 `app / pages / modules` 三层组织和状态、工具、组件的落位规则
- [x] 已完成首批目录物理迁移：页面按业务域分目录，系统管理公共页能力迁到 `src/modules/system-management`
- [x] 已完成第二批运行时目录迁移：`app` 下的路由、会话、导航、配置、文案已拆到职责子目录
- [x] 已完成第三批结构收口：`app-context` 迁到 `src/app/providers`，全局样式入口迁到 `src/styles/index.css`
- [x] 已完成第四批共享组件收口：反馈组件迁到 `src/components/feedback`，`ProtectedRoute` 迁回 `src/app/router`
- [x] 已重写 `README.md`，同步当前结构、启动方式、接入方式和已知边界
- [x] 已将侧栏 header logo 从登录 logo 中拆分，改为独立壳层 branding 配置，并替换为 `inforsuiteag_dashboard` 的侧栏图标资源
- [x] 已在源仓库补齐模板独立仓库导出与同步底座：`scripts/template/export-template-repo.mjs`、`scripts/template/sync-template-repo.mjs`、`release-github-packages.yml` 内的下游同步 job
- [x] 已在 GitHub 创建独立模板仓库 `gjxwxt/template-react-starter`，并配置源仓库变量与 deploy key 自动同步链路
- [x] 已把模板目录命令改为本地执行口径，并补齐模板本地 `eslint.config.mjs`，避免独立仓库继续依赖 monorepo 根配置
- [x] 已将外网链路改成严格串行：`PR -> Verify -> merge main -> Verify(push main) -> Release -> Template Sync`

## What's In Progress

- [ ] 启动 `release-integration-ready`
  - Details: 沉淀登录、壳层上下文、服务端菜单树和错误码适配的真实后端接入样例
  - Blockers: 无
- [ ] `release-publishing-ready` 的剩余收口
  - Details: 模板 tag / release 自动化、`main` 分支 required checks 策略确认、独立仓库消费侧 `read:packages` 权限验证仍未完成
  - Blockers: 当前本机 `gh auth token` 不含 `read:packages`，无法完成 GitHub Packages 私有包安装验收

## What's Next

1. 执行 `release-integration-ready`
2. 补齐模板 tag / release 自动化与模板仓库消费侧权限验证
3. 执行 `pilot-trial-acceptance`

## Risks

- 组件库构建时仍有既有的默认导出告警，这不是模板本身新增问题
- 当前发布计划已写清，但后续 agent 如果不严格按 feature 顺序推进，仍然容易重新扩 scope
- 独立模板仓库当前的代码导出与同步已验证，但业务方本地安装仍依赖具备 `read:packages` 的 GitHub token

## Files Modified In This Stage

- `AGENTS.md`, `AGENT.md`
- `docs/README.md`, `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, `docs/PROJECT_STRUCTURE.md`, `docs/ROUTING_AND_PERMISSIONS.md`, `docs/RELEASE_PLAN.md`, `docs/AI_WORKFLOW.md`, `docs/SMOKE_TESTING.md`
- `feature_list.json`, `progress.md`, `session-handoff.md`, `init.sh`, `package.json`
- `docs/TEMPLATE_REPO_SYNC.md`, `eslint.config.mjs`
- `src/app/router/*`, `src/app/session/*`, `src/app/navigation/*`, `src/app/config/*`, `src/app/i18n/*`, `src/app/server-menu.ts`, `src/app/permissions.ts`
- `src/api/client.ts`, `src/api/mock/server-menu.ts`, `src/api/mock/system.ts`, `src/api/mock/user-context.ts`, `src/api/system.ts`
- `src/layouts/app-shell.tsx`
- `src/components/feedback/*`
- `src/pages/auth/login/page.tsx`, `src/pages/workbench/dashboard/page.tsx`, `src/pages/workbench/tasks/page.tsx`, `src/pages/assets/asset-detail/page.tsx`
- `src/pages/system/users/page.tsx`, `src/pages/system/roles/page.tsx`, `src/pages/system/departments/page.tsx`, `src/pages/system/dictionaries/page.tsx`
- `src/pages/exception/forbidden/page.tsx`, `src/pages/exception/not-found/page.tsx`, `src/pages/exception/server-error/page.tsx`
- `src/app/providers/*`, `src/modules/system-management/page-helpers.tsx`, `src/styles/index.css`, `README.md`, `public/png/infors-sidebar-logo.png`

## Evidence

- [x] `corepack pnpm lint`
- [x] `corepack pnpm typecheck`
- [x] `corepack pnpm build`
- [x] `corepack pnpm smoke`
- [x] `node scripts/template/export-template-repo.mjs --target github --output .template-export --repository gjxwxt/template-react-starter --scope gjxwxt --dry-run`
- [x] `node scripts/template/sync-template-repo.mjs --source .template-export --repo-url https://github.com/gjxwxt/template-react-starter.git --branch main --commit-message "chore(template): sync dry-run" --dry-run`

## Notes For Next Session

- 如果任务和系统管理样例有关，优先看 `src/pages/system/*/page.tsx`、`src/modules/system-management/page-helpers.tsx` 和 `src/api/mock/system.ts`
- 如果任务和路由、壳层、会话有关，优先看 `src/app/router/*`、`src/app/session/*`、`src/app/navigation/*`
- 如果任务和壳层、权限、菜单有关，先读 `docs/ROUTING_AND_PERMISSIONS.md`
- 如果任务和收口、接入、发布有关，先读 `docs/RELEASE_PLAN.md`
- 如果任务和模板独立仓库同步有关，先读 `docs/TEMPLATE_REPO_SYNC.md`、根目录 `scripts/template/*` 和 `.github/workflows/release-github-packages.yml`
