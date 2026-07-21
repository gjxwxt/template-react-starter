# Session Handoff

## Current Objective

- Goal: 让 `template-react` 成为可持续接力的企业模板工程，而不是一次性 Demo
- Current status: AI 协作文档、状态文件、系统管理样例矩阵和发布阶段计划已到位
- Current status: 模板独立仓库导出与 GitHub 自动同步底座已落地，但模板 tag / release 自动化和消费侧权限验证仍未收尾
- Branch / commit: 未记录

## Completed This Session

- [x] 新增 `docs/RELEASE_PLAN.md`，明确发布阶段目标、非目标、feature 顺序和验收口径
- [x] 更新 `AGENTS.md`、`docs/README.md`、`docs/AI_WORKFLOW.md`，把发布计划接入文档入口
- [x] 把发布阶段拆成 `release-quality-gate -> release-permission-closure -> release-integration-ready -> release-publishing-ready -> pilot-trial-acceptance`
- [x] 完成 `release-quality-gate`，添加 Playwright smoke 测试验证链路，并接入 `init.sh` 质量门禁
- [x] 完成 `release-permission-closure`，确立按钮权限为可选能力，完成业务页面（任务、资产）接入，以及多角色 Mock 权限联调。
- [x] 新增 `docs/PROJECT_STRUCTURE.md`，明确模板目录拆分原则，约束页面、模块、组件、状态和工具函数的落位方式。
- [x] 完成首批目录物理迁移，把页面改为按业务域分目录，并将系统管理公共页能力迁到 `src/modules/system-management/page-helpers.tsx`。
- [x] 完成第二批运行时目录迁移，把 `app` 下的路由、会话、导航、配置、文案拆到职责子目录并补目录出口。
- [x] 完成第三批结构收口，把 `app-context` 迁到 `src/app/providers`，并把全局样式入口迁到 `src/styles/index.css`。
- [x] 完成第四批共享组件收口，把反馈组件迁到 `src/components/feedback`，并把 `ProtectedRoute` 收回 `src/app/router`。
- [x] 重写 `README.md`，使其与当前目录结构、验证链路和接入策略保持一致。
- [x] 侧栏 header 改为独立壳层 logo 配置，登录页继续保留原有 `cvicse-logo`，并接入 `inforsuiteag_dashboard` 的侧栏 logo 资源与对应尺寸。
- [x] 新增 `scripts/template/export-template-repo.mjs` 与 `scripts/template/sync-template-repo.mjs`，把模板从 monorepo 导出为独立仓库形态，并支持 dry-run 同步到 `gjxwxt/template-react-starter`。
- [x] 更新根目录 `package.json`、`verify.yml`、`release-github-packages.yml`、发布文档和模板同步文档，把模板导出 dry-run 和 `push main` 自动同步正式接入 GitHub 流程。
- [x] 在 GitHub 创建独立模板仓库 `gjxwxt/template-react-starter`，并在源仓库配置 `TEMPLATE_REPO_OWNER`、`TEMPLATE_REPO_NAME`、`TEMPLATE_REPO_BRANCH`、`PACKAGES_SCOPE` 和 `TEMPLATE_REPO_SYNC_SSH_KEY`。
- [x] 将模板目录命令统一为本地执行口径，补齐 `apps/template-react/eslint.config.mjs`，并清理未使用的直连 workspace 依赖。
- [x] 将 GitHub 外网链路改为严格串行：`Verify(push main)` 成功后才触发 release workflow，模板同步收编为 release workflow 的下游 job，不再与 publish 并行。

## Verification Evidence

| Check          | Command                                                                                                                                                                                                           | Result | Notes                              |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------- |
| Lint           | `corepack pnpm lint`                                                                                                                                                                                              | Passed | 无新增 lint 问题                   |
| Type Check     | `corepack pnpm typecheck`                                                                                                                                                                                         | Passed | 无新增类型错误                     |
| Build          | `corepack pnpm build`                                                                                                                                                                                             | Passed | 保留组件库既有默认导出告警         |
| Smoke          | `corepack pnpm smoke`                                                                                                                                                                                             | Passed | 覆盖登录、导航、系统管理主路径     |
| Export dry-run | `node scripts/template/export-template-repo.mjs --target github --output .template-export --repository gjxwxt/template-react-starter --scope gjxwxt --dry-run`                                                    | Passed | 导出结果已改写为独立仓库依赖与配置 |
| Sync dry-run   | `node scripts/template/sync-template-repo.mjs --source .template-export --repo-url https://github.com/gjxwxt/template-react-starter.git --branch main --commit-message "chore(template): sync dry-run" --dry-run` | Passed | 确认可覆盖目标仓库并形成稳定变更集 |

## Files Changed

- `AGENTS.md`, `AGENT.md`, `docs/*`
- `feature_list.json`, `progress.md`, `session-handoff.md`, `init.sh`
- 根目录 `package.json`, `.gitignore`, `.github/workflows/*`, `docs/release-strategy.md`, `docs/scripts-guide.md`, `scripts/template/*`
- `src/app/router/*`, `src/app/session/*`, `src/app/navigation/*`, `src/app/config/*`, `src/app/i18n/*`, `src/app/providers/*`, `src/app/server-menu.ts`, `src/app/permissions.ts`, `src/api/*`, `src/layouts/app-shell.tsx`
- `src/components/feedback/*`
- `src/pages/auth/login/*`, `src/pages/workbench/dashboard/*`, `src/pages/workbench/tasks/*`, `src/pages/assets/asset-detail/*`
- `src/pages/system/users/*`, `src/pages/system/roles/*`, `src/pages/system/departments/*`, `src/pages/system/dictionaries/*`
- `src/pages/exception/forbidden/*`, `src/pages/exception/not-found/*`, `src/pages/exception/server-error/*`
- `src/modules/system-management/page-helpers.tsx`, `src/styles/index.css`, `README.md`, `public/png/infors-sidebar-logo.png`

## Decisions Made

- 模板继续使用“本地路由注册 + 服务端菜单适配”的混合方案
- 关键约束注释统一为简洁中文注释
- `AGENTS.md` 作为权威入口，`AGENT.md` 只做轻量转发
- 模板目录采用 `app / pages / modules` 三层组织，不单独新增根级 `store/` 作为通用堆放区
- `app` 运行时目录继续按职责下钻，不再回到单层平铺文件结构
- provider 入口统一走 `src/app/providers/*`，不再把 `AppProvider` 和 `useAppContext` 留在 `app` 根目录
- 反馈组件统一收敛到 `src/components/feedback/*`，路由守卫归属 `src/app/router/*`
- 系统管理母版按四种高频模式沉淀：标准列表、权限树、左树右表、主从表
- `v1` 先做到可发布试点的模板母版，不提前扩成 CLI 或全动态平台
- 发布阶段必须按文档定义的 feature 顺序推进，不允许跳阶段
- 模板独立仓库继续采用“源仓库单向同步”模式，不允许在模板仓库长期双向开发
- GitHub 仓库变量不能以 `GITHUB_` 开头，因此外网 scope / repository URL 变量统一采用 `PACKAGES_SCOPE`、`PACKAGES_REPOSITORY_URL`
- 外网 workflow 现在采用严格链路：`PR -> Verify -> merge main -> Verify(push main) -> Release -> Template Sync`

## Blockers / Risks

- 当前只是把发布计划固化到文档和状态文件，但已经开始逐项实现
- `release-quality-gate` 已完整落地：已将 Playwright 作为 devDependency 安装，并修正了内网 registry 导致的拉取失败问题。同时修正了 Smoke Test 中的文案断言和页签 DOM 强耦合问题，本地执行已通过。
- 独立模板仓库的本地安装验收仍未闭环：当前本机 `gh auth token` 缺少 `read:packages`，对私有 GitHub Packages 会返回 403，需使用具备该权限的 token 再完成一次消费侧安装验证。
- 当前 GitHub 私有仓库在本账号/套餐下无法调用 branch protection API，无法直接从脚本侧确认 required checks 是否已强制开启；这部分需要在 GitHub 页面或升级套餐后确认。

## Next Session Startup

1. 读 `AGENTS.md`
2. 读 `docs/README.md`
3. 读 `feature_list.json` 和 `progress.md`
4. 运行 `./init.sh`

## Recommended Next Step

- 先回到 `release-integration-ready`，补真实后端接入契约；随后再收尾模板 tag / release 自动化与模板仓库消费侧权限验证。
