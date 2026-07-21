# Project Structure

## 目标

这份文档定义 `template-react` 的统一目录拆分逻辑，给业务团队和 AI 一个稳定的放置规则。

目标不是把模板做成“全动态平台”或“过度抽象的架构样板”，而是让下面几件事长期可控：

- 新页面知道该落到哪里
- 复用逻辑知道什么时候上提
- 全局状态不演变成根级 `store` 垃圾桶
- `utils`、`components`、`shared` 不变成杂物间

## 总设计

模板采用“应用运行时 + 路由页入口 + 跨页业务模块”的三层组织方式：

1. `app`：全局运行时和壳层规则
2. `pages`：路由页面入口
3. `modules`：跨页面复用的业务逻辑

这三层之外，再保留少量真正全局的 `components`、`hooks`、`utils`、`types`、`styles`。

## 关键决策

### 1. 不单独设根级 `store/`

React 模板不建议像传统后台项目那样先建一个根级 `store/`，原因很简单：它很容易变成所有状态的堆放区。

统一规则如下：

- 全局会话、主题、语言、页签、侧边栏状态：放 `src/app/`
- 同一业务域、且被多个页面共享的状态：放 `src/modules/<domain>/store.ts`
- 单页查询条件、弹窗开关、表单草稿：留在页面内，用 `useState`、`useReducer` 或页面私有 hook 处理

### 2. 页面目录只负责“路由入口”

`pages` 只放能被路由直接挂载的页面。页面目录负责组装：

- 页面布局
- 页面级数据请求
- 页面级权限收口
- 页面私有交互状态

不要把跨多个页面复用的业务逻辑继续堆在 `pages` 里。

### 3. 跨页业务逻辑进入 `modules`

当一段逻辑同时满足下面两个条件时，应从 `pages` 中上提到 `modules`：

- 属于同一个业务域
- 被两个及以上页面复用

典型例子：

- 系统管理页共用的表格列、弹窗、选项映射
- 任务域共用的状态文案、筛选参数转换
- 资产域共用的详情适配器、读写权限判断

### 4. `components` 只放“跨域通用组件”

只有真正跨页面、跨业务域都能复用的组件，才放到 `src/components/`。

如果组件只被某一个页面使用，就放页面目录下。
如果组件被同一业务域的多个页面复用，就放到对应 `modules/<domain>/components/`。

### 5. `utils` 只放纯函数

`src/utils/` 只允许放纯工具函数，要求：

- 不依赖 React
- 不依赖路由
- 不读写 localStorage
- 不直接发请求
- 不夹带业务页面副作用

只要一个工具函数带有明确业务语义，就应该留在页面目录或模块目录，而不是上提到根级 `utils/`。

## 推荐目录树

这是模板的推荐目标结构。不是要求一次性把所有目录建出来，而是后续新增代码按这个规则进入。

```text
src/
  main.tsx                    # 挂载入口，只做 render
  App.tsx                     # 根组件，只做 provider 和 router 组装

  app/                        # 全局运行时
    config/                   # 模板配置、环境开关
    providers/                # 全局 provider 组装
    router/                   # 路由注册、守卫、导航事件
    session/                  # 会话模型、持久化、会话事件
    navigation/               # 页签、菜单、导航态
    i18n/                     # 文案和语言切换

  api/                        # 请求与接口适配
    core/                     # ApiError、请求类型、通用错误处理
    modules/                  # auth/system/tasks/assets 等接口模块
    mock/                     # mock 数据与 mock 分发
    adapters/                 # 真实后端字段适配器，可按需增加

  layouts/                    # 壳层布局，只做框架，不放业务逻辑

  pages/                      # 路由页面入口
    auth/
      login/
        index.ts
        page.tsx
    workbench/
      dashboard/
        index.ts
        page.tsx
      tasks/
        index.ts
        page.tsx
        columns.tsx
        hooks/
        components/
    assets/
      asset-detail/
        index.ts
        page.tsx
        components/
    system/
      users/
        index.ts
        page.tsx
        columns.tsx
        components/
      roles/
      departments/
      dictionaries/
    exception/
      forbidden/
      not-found/
      server-error/

  modules/                    # 跨页面复用的业务域逻辑
    auth/
    account/
    tasks/
    assets/
    system-management/
      components/
      hooks/
      utils/
      constants.ts
      types.ts

  components/                 # 跨域通用组件
  hooks/                      # 跨域通用 hook
  utils/                      # 纯函数工具
  types/                      # 全局共享类型
  styles/                     # 全局样式入口、主题补丁、滚动条等
  assets/                     # 需要被源码 import 的静态资源
```

## 目录职责

### `main.tsx`

只做挂载，不写业务逻辑，不初始化菜单，不处理登录重定向。

### `App.tsx`

只做根级组装，例如：

- `BrowserRouter`
- `AppProvider`
- 未来新增的错误边界、主题 provider

不要把页面逻辑、会话刷新、接口请求写进 `App.tsx`。

### `app/`

这里放“整个应用都必须知道”的东西：

- 路由真源
- 全局会话模型
- 本地持久化
- 主题、语言、侧边栏折叠态
- 导航广播事件
- 模板级配置

一句话判断：如果它描述的是“应用怎么运行”，就进 `app/`。

### `layouts/`

这里放框架壳层，例如：

- 侧边栏
- 顶部导航
- 页签区
- 内容区滚动容器

布局层只负责承载页面，不负责沉淀某个业务域的具体逻辑。

### `pages/`

这里的每个目录都应该能被路由直接挂载。页面目录可以包含：

- `page.tsx`：页面入口组件
- `components/`：页面私有组件
- `hooks/`：页面私有 hook
- `columns.tsx` / `schema.ts` / `constants.ts`：页面专属配置
- `index.ts`：目录公共导出

如果一个页面只有一个文件，可以先只放 `page.tsx + index.ts`，不要为了“看起来完整”硬建空目录。

### `modules/`

这里承接“跨页复用，但仍有业务语义”的代码。它和 `components/` 的区别是：

- `modules/` 有业务域归属
- `components/` 不带业务域语义

例如系统管理下四个示例页共用的逻辑，就应该优先放到 `modules/system-management/`，而不是继续放在 `pages/` 根目录平铺。

### `components/`

只放模板级共用组件，例如：

- 通用异常态包装
- 通用空态区块
- 通用权限守卫包装

组件如果明显带有某个域前缀或页面上下文，就不应该进这里。

### `hooks/`

只放跨域复用的 hook，例如：

- `use-responsive`
- `use-scroll-shadow`

如果 hook 只服务于任务页或系统管理域，就分别进入 `pages` 或 `modules`。

### `utils/`

这里放纯函数，例如：

- 日期格式化
- 百分比显示
- 查询串转换

禁止把接口请求、权限判断、路由跳转这类副作用逻辑塞到根级 `utils/`。

### `types/`

这里只放真正全局共享的类型。模块专属类型继续放模块内，页面专属类型继续放页面内。

### `styles/`

这里放全局样式入口和模板级样式规则，例如：

- 全局变量
- 全局滚动条策略
- 页面壳层背景

页面或模块独有样式应尽量与页面或模块同目录收纳。

### `assets/` 与 `public/`

统一规则：

- 需要被 TS/TSX `import` 的资源：放 `src/assets/`
- 需要走绝对 URL、构建时原样拷贝的资源：放 `public/`

登录背景、404 图片这类模板静态图，如果只是通过 URL 引用，继续放 `public/` 是合理的。

## 放置判定顺序

新增代码时，按下面顺序判断：

1. 只给一个路由页面使用：放 `pages/<route>/`
2. 同一业务域多个页面复用：放 `modules/<domain>/`
3. 多个业务域都复用，且没有业务语义：放 `components/`、`hooks/`、`utils/`、`types/`
4. 整个应用运行时都依赖：放 `app/`

这个顺序可以避免“还没复用就过早抽象”，也能避免“明明已经跨页复用却还堆在页面里”。

## 命名约束

- 目录统一用 `kebab-case`
- `index.ts` 只做当前目录的公共导出
- 页面入口统一叫 `page.tsx`
- 布局组件统一带 `layout` 或 `shell` 语义
- 不再新增 `shared.tsx`、`common.ts`、`helper.ts` 这类语义模糊文件名

如果必须使用 `shared`，要把作用域写清楚，例如：

- `modules/system-management/shared/`
- `pages/tasks/components/shared-filter.tsx`

## 当前模板的迁移进度

首批低风险迁移已经完成：

1. 页面文件已从 `src/pages/*.tsx` 平铺结构改为按业务域分目录收纳
2. 系统管理公共页能力已从 `pages` 根目录上提到 `src/modules/system-management/page-helpers.tsx`
3. `app` 运行时核心目录已拆到 `src/app/router/`、`src/app/session/`、`src/app/navigation/`、`src/app/config/`、`src/app/i18n/`
4. `AppProvider` 和 `useAppContext` 已迁到 `src/app/providers/`
5. 反馈组件已收敛到 `src/components/feedback/`

下一批建议按触点渐进推进：

1. `src/components/account-center-dialog.tsx` 视后续复用范围，决定是否收口到 `src/modules/account/`
2. `src/styles/index.css` 后续如继续膨胀，再拆分为主题、壳层、页面级全局规则
3. 若后续 provider 继续增多，再补 `src/app/providers/` 下的 provider 组合入口

## 当前不建议做的事

- 不为了“架构完整”一次性创建大量空目录
- 不把模板提前扩成 CLI 生成器
- 不做运行时全动态页面注册平台
- 不把所有状态集中到一个根级 `store`
- 不新增根级 `shared/` 杂物目录，除非职责边界先写清楚

## 对业务团队的直接价值

这套拆分方式的直接收益是：

- 新同学和 AI 更容易判断代码该放哪
- 页面膨胀时不需要推倒重来
- 系统管理、任务、资产这类域可以自然沉淀为模板能力
- 后续真实后端接入时，接口、适配器、页面、权限的边界更清楚
