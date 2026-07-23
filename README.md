# Template React

当前仓库是从 [gjxwxt/react-components](https://github.com/gjxwxt/react-components) 的 `apps/template-react` 单向同步导出的独立模板仓库，发布镜像地址是 [gjxwxt/template-react-starter](https://github.com/gjxwxt/template-react-starter)。

它基于 `@gjxwxt/react-components` 体系运行，不是单纯的组件演示工程。

它的目标是：

- 给业务项目一个可直接接入的 React 后台起点
- 先把壳层、菜单、权限、页面模板、mock 链路和接入文档收口
- 先做到可试点、可发布的模板母版，而不是一开始就做 CLI 或全动态平台

## 当前适合做什么

当前模板适合以下场景：

- 新业务项目快速起盘
- 组件库展示企业后台标准用法
- 业务试点验证菜单、权限、列表页、详情页的通用结构
- AI 协作开发时作为统一基线工程

## 当前已具备的能力

- 登录页、会话持久化、登录失效处理
- 顶部导航、左侧侧栏、可折叠菜单、多页签导航
- `local` 本地路由模式和 `server` 服务端菜单模式双通道
- 页面级权限和可选的按钮级 `permissionCodes`
- 统一请求层，支持 `mock / real API` 切换
- 统一异常页、结果态、空态反馈组件
- Dashboard、任务列表、资产详情、用户管理、角色管理、部门管理、字典管理等样例页
- 系统管理四种高频页面模板：标准列表、权限树、左树右表、主从表
- 个人中心弹窗：资料维护 + 修改密码
- `lint / typecheck / build / smoke` 发布前质量门禁

## GitHub Pages 预览部署

独立模板仓库已集成 GitHub Pages 自动化部署。构建命令使用 `pnpm build:pages`（环境变量 `VITE_PUBLIC_BASE_PATH` + 自动生成 `dist/404.html` 保证 `BrowserRouter` 刷新回退）。

## 快速开始

### 环境要求

- Node.js：建议 `20+`
- 包管理器：仓库统一使用 `pnpm@10.32.1`

### 安装依赖

在仓库根目录执行：

```bash
corepack pnpm install
```

### 启动模板

```bash
corepack pnpm dev
```

- 默认地址：[http://localhost:5175](http://localhost:5175)
- 预览端口同样使用 `5175`

### 一键验证

在仓库根目录执行：

```bash
./init.sh
```

这会依次执行：

- `lint`
- `typecheck`
- `build`
- `smoke`

### 常用命令

```bash
corepack pnpm dev
corepack pnpm build
corepack pnpm preview
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm smoke
```

## 建议接手顺序

第一次接手模板时，建议按这个顺序进入：

1. 先读 [AGENTS.md](./AGENTS.md)
2. 再读 [docs/README.md](./docs/README.md)
3. 然后看 [src/app/router/routes.tsx](./src/app/router/routes.tsx) 了解页面真源
4. 最后结合 [docs/PROJECT_STRUCTURE.md](./docs/PROJECT_STRUCTURE.md) 决定新代码落位

如果只是要新增一个页面，通常只需要先看：

- [src/app/router/routes.tsx](./src/app/router/routes.tsx)
- [src/pages](./src/pages)
- [src/app/i18n/texts.ts](./src/app/i18n/texts.ts)

## mock 模式说明

默认使用 mock：

```bash
VITE_API_MOCK=true
```

mock 模式下的演示约定：

- 登录名包含 `admin` 或其他普通值时，默认进入管理员视角
- 登录名包含 `operator` 时，会进入运营角色视角
- 登录名包含 `viewer` 时，会进入只读角色视角
- 开发环境验证码输入 `0000` 可直接通过，用于 smoke 和本地调试

可直接用于本地演示的示例：

- `admin`
- `operator-demo`
- `viewer-demo`

## 关键配置

环境变量见 [`.env.example`](./.env.example)：

```bash
VITE_API_BASE_URL=/api
VITE_API_MOCK=true
VITE_TEMPLATE_ENABLE_LOCALE_SWITCH=false
VITE_TEMPLATE_NAVIGATION_MODE=local
```

配置含义：

- `VITE_API_BASE_URL`：真实后端地址
- `VITE_API_MOCK`：是否走模板内置 mock
- `VITE_TEMPLATE_ENABLE_LOCALE_SWITCH`：是否开启语言切换
- `VITE_TEMPLATE_NAVIGATION_MODE`：`local` 或 `server`

模板级总配置在 [src/app/config/template-config.ts](./src/app/config/template-config.ts)，这里集中控制：

- 登录、首页、403、404、500 路径
- API 基础地址和超时
- mock 开关
- branding 资源（登录页 logo 和侧栏 header logo）
- 语言和导航模式开关

## 路由、菜单、权限

### 本地路由真源

本地路由注册表在 [src/app/router/routes.tsx](./src/app/router/routes.tsx)。

这里统一定义：

- 页面路径
- 标题 key
- 侧栏分组
- 默认 affix 页签
- 本地角色兜底
- `serverRoutePath`
- `serverPermissionCode`

### 两种导航模式

`local` 模式：

- 以前端本地路由表为主
- 用角色兜底做页面可见性控制

`server` 模式：

- 登录后请求壳层上下文
- 后端返回 `allowedRouteIds + navigationGroups + permissionCodes`
- 壳层据此裁剪菜单、分组和操作权限

### 服务端菜单树适配

后端菜单树适配入口在 [src/app/server-menu.ts](./src/app/server-menu.ts)。

当前模板约定：

- `type=1`：目录节点
- `type=2`：页面菜单节点
- `type=3`：按钮 / 操作权限节点

模板默认不做“后端给一个未知 URL，前端运行时自动长出未知页面”。

推荐做法是：

1. 前端保留本地路由注册表
2. 后端菜单树只决定可见性、分组、展示名和权限码
3. 用 `serverRoutePath` 或 `serverPermissionCode` 映射回本地已注册页面

### 按钮级权限

按钮级 `permissionCodes` 是模板的可选示范能力，不是强制策略。

这意味着：

- 只做页面权限的项目可以直接接
- 需要细粒度按钮权限的项目也可以继续增强

## 常见业务裁剪

模板默认把企业后台常见能力先放进来，但不是每个项目都必须全开。

### 不需要国际化

如果项目当前只做中文：

- 保持 `VITE_TEMPLATE_ENABLE_LOCALE_SWITCH=false`
- 继续只维护 [src/app/i18n/texts.ts](./src/app/i18n/texts.ts) 的中文主文案即可
- 暂时不用补语言切换 UI

### 不需要服务端动态菜单

如果后端暂时不返回菜单树：

- 保持 `VITE_TEMPLATE_NAVIGATION_MODE=local`
- 继续以前端本地路由表为页面真源
- 只在登录后返回最小会话信息即可

### 不需要按钮级权限

如果产品只做页面访问权限：

- 可以只维护页面可见性
- `permissionCodes` 相关逻辑可以继续保留为模板能力，但业务上不必强制接入
- 模板现有写法仍然兼容这种简化模式

## 页面模板矩阵

当前模板已经沉淀了几类常见后台页面模式：

- Dashboard：系统概览与资源卡片
- 标准列表页：任务列表、用户管理
- 权限树页：角色管理
- 左树右表页：部门管理
- 主从表页：字典管理
- 详情编辑页：资产详情

如果业务新增页面，优先沿用现有模式，不建议每页重新发明结构。

## 当前目录结构

```text
src/
  api/                # 请求层、接口模块、mock
  app/
    config/           # 模板配置
    i18n/             # 文案
    navigation/       # 导航事件
    providers/        # AppProvider 与 useAppContext
    router/           # 路由注册、路由守卫、路由入口
    session/          # 会话与本地持久化
  components/
    feedback/         # 异常态、结果态、空态
  layouts/            # 应用壳层
  modules/            # 跨页复用业务域逻辑
  pages/              # 路由页面入口
  styles/             # 全局样式入口
```

更细的目录规则看 [docs/PROJECT_STRUCTURE.md](./docs/PROJECT_STRUCTURE.md)。

## 真实后端接入建议

### 最小接入顺序

1. 把 `VITE_API_MOCK` 改成 `false`
2. 配置 `VITE_API_BASE_URL`
3. 替换 `src/api/*.ts` 的接口实现
4. 登录成功后返回真实 token 和最小登录态
5. 按需要决定用 `local` 还是 `server` 导航模式
6. 若是 `server` 模式，补齐壳层上下文或菜单树适配

### 推荐后端拆法

建议至少拆成这几类接口：

1. 登录接口：返回 token 和最小登录态
2. 壳层上下文接口：返回 `displayName / department / email / phone / allowedRouteIds / navigationGroups / permissionCodes`
3. 个人资料更新接口
4. 密码修改接口

如果当前只能参考 Vue 模板，也足够先完成第一版接入契约。优先保持这三件事一致：

1. 登录返回的最小会话结构
2. 壳层上下文里菜单、权限、用户信息的字段语义
3. 错误码和未登录失效处理的跳转策略

### 页面新增时怎么接

1. 在 [src/app/router/routes.tsx](./src/app/router/routes.tsx) 注册本地路由
2. 在 `src/pages` 下按业务域新增页面目录
3. 在 [src/app/i18n/texts.ts](./src/app/i18n/texts.ts) 补页面标题和文案
4. 如需接服务端菜单，同步补 `serverRoutePath / serverPermissionCode`
5. 如需按钮权限，再逐步接 `hasPermissionCode`

## 文档入口

业务接手和 AI 接手时，优先看这些文档：

- [AGENTS.md](./AGENTS.md)
- [docs/README.md](./docs/README.md)
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- [docs/PROJECT_STRUCTURE.md](./docs/PROJECT_STRUCTURE.md)
- [docs/ROUTING_AND_PERMISSIONS.md](./docs/ROUTING_AND_PERMISSIONS.md)
- [docs/RELEASE_PLAN.md](./docs/RELEASE_PLAN.md)

## 当前边界

当前模板已经适合业务试点，但还不是“组织级零配置脚手架”。当前边界仍然保留为：

- 主题切换当前以 sidebar 主题为主，全局主题体系还没有完全产品化
- 服务端菜单模式支持菜单树适配，但不建议扩成运行时未知页面注册平台
- 还没有 CLI 生成器，当前仍以模板母版收口为主
- 是否进入 `stable` 仍取决于后续 1 到 2 个业务试点结果

## 建议使用方式

把它当成业务项目的 `starter`，不要当成一次发布后永远不再演进的“万能脚手架”。

更合理的方式是：

1. 先让 1 到 2 个业务项目试点接入
2. 把真实菜单、权限、错误码、表格字段模式沉淀回来
3. 再决定哪些部分适合继续抽成 CLI 或命令式生成器

## GitHub Packages 安装准备

独立模板仓库默认从 GitHub Packages 安装组件依赖。首次安装前，请按 [`.npmrc.example`](./.npmrc.example) 准备根目录 `.npmrc`，并提供具备 `read:packages` 权限的 `GITHUB_PACKAGES_TOKEN`。

`@gjxwxt/*` 相关依赖会在导出阶段被改写为真实版本号，不再保留 monorepo 内的 `workspace:*` 写法。

## GitHub Packages 安装准备

独立模板仓库默认从 GitHub Packages 安装组件依赖。首次安装前，请按 [`.npmrc.example`](./.npmrc.example) 准备根目录 `.npmrc`，并提供具备 `read:packages` 权限的 `GITHUB_PACKAGES_TOKEN`。

`@gjxwxt/*` 相关依赖会在导出阶段被改写为真实版本号，不再保留 monorepo 内的 `workspace:*` 写法。
