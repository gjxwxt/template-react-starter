# Template Repo Sync

## 目标

`template-react` 在研发阶段继续留在当前 monorepo 中维护，但在对业务方正式交付时，不直接让业务团队依赖整个 `react-components` 仓库。

推荐架构是：

1. `react-components` 仓库作为唯一真源
2. `apps/template-react` 作为模板源目录
3. 独立模板仓库作为发布镜像
4. 业务项目从独立模板仓库的 tag 初始化

核心原则只有一条：

- **单向同步，不双向开发**

也就是：

- 日常开发只在源仓库做
- 发布时自动导出并同步到独立模板仓库
- 模板仓库原则上不直接做功能开发

## 为什么不建议双向维护

如果源仓库和模板仓库都允许直接开发，会很快出现以下问题：

1. 不知道哪边才是模板真源
2. 相同 bug 会在两个仓库重复修
3. 组件库升级与模板修复无法保证同时落地
4. 后续热修复无法稳定回灌

因此必须明确：

- `react-components` 是模板唯一真源
- 模板仓库是**发布镜像仓库**

## 仓库职责分层

### 1. 源仓库：`react-components`

职责：

1. 维护组件库源码
2. 维护 `apps/template-react` 模板源码
3. 维护模板和组件库的联调、验证、文档和 release 计划
4. 作为所有模板功能修复的唯一开发入口

特点：

1. 适合做联调
2. 适合做结构收口
3. 适合做 breaking change 控制

### 2. 模板仓库：`gjxwxt/template-react-starter`

职责：

1. 对业务方提供可直接拉取的模板仓库
2. 只保留模板运行所需文件
3. 使用已发布的组件库版本，而不是 workspace 依赖
4. 提供模板自身的 tag、release 和使用说明

当前外网仓库地址：

- [https://github.com/gjxwxt/template-react-starter](https://github.com/gjxwxt/template-react-starter)

特点：

1. 面向业务方消费
2. 保持目录干净
3. 不承担组件库研发职责

### 3. 业务项目仓库

职责：

1. 承载真正的业务代码
2. 基于模板 tag 初始化后独立演进
3. 按需吸收模板后续补丁

特点：

1. 不再与模板仓库做日常同步
2. 与模板仓库的关系是“起始基线”，不是“长期主从”

## 推荐同步模式

### 总体模式

发布时按以下顺序执行：

1. 在源仓库完成 template 相关改动
2. 在源仓库完成验证
3. 如果本次 release 包含 template 变更，则执行模板导出
4. 将导出结果同步到模板仓库
5. 在模板仓库打模板专属 tag / release

这意味着：

1. 平时不需要维护两份代码
2. 只有 release 时才会产生第二份仓库内容
3. 模板仓库内容始终来源于已验证过的源模板

### 触发条件

只有在以下任一条件满足时，才触发模板同步：

1. `apps/template-react/**` 有改动
2. 模板依赖的组件库版本发生变化，且需要对业务方重新交付模板
3. 模板文档、接入说明、RC 规则发生变化，且需要反映到业务方模板仓库

建议不要因为纯组件库内部变动就自动同步模板仓库。

## 模板导出范围

从 `react-components` 导出到模板仓库时，建议只同步这部分：

```text
apps/template-react/
  public/
  src/
  docs/
  e2e/
  .env.example
  AGENTS.md
  AGENT.md
  README.md
  feature_list.json
  init.sh
  package.json
  progress.md
  session-handoff.md
  tsconfig*.json
  vite.config.*
```

不建议直接把以下内容同步过去：

1. 根仓库的 `packages/*`
2. 根仓库的 Changesets
3. 根仓库的组件库 CI 配置
4. 仅服务于 monorepo 的脚本和工具文件

## 模板仓库需要额外补的内容

导出时，模板仓库需要具备独立运行能力，所以应该额外生成或补齐：

1. 独立仓库自己的 `.gitignore`
2. 独立仓库自己的 `.npmrc` 或安装说明
3. 模板专属 CI
4. 模板专属 Release 说明
5. 模板仓库自己的 `README`

当前实现里，这部分由导出脚本自动补齐：

1. `.gitignore`
2. `.npmrc.example`
3. 面向独立仓库的 `README` 头部说明

## 依赖改写策略

源模板里当前依赖的是 workspace 包：

```json
{
  "@gjxwxt/react-components": "workspace:*",
  "@gjxwxt/react-style-base": "workspace:*",
  "@gjxwxt/icons": "workspace:*",
  "@gjxwxt/config-react": "workspace:*"
}
```

导出到模板仓库时，必须改写成**真实版本号**，例如：

```json
{
  "@gjxwxt/react-components": "^0.3.2",
  "@gjxwxt/react-style-base": "^0.2.0",
  "@gjxwxt/icons": "^0.1.0",
  "@gjxwxt/config-react": "^0.1.1"
}
```

如果外网模板仓库面向 GitHub Packages，则还需要按外网 scope 改写，例如：

```json
{
  "@gjxwxt/react-components": "^0.3.2"
}
```

因此导出脚本至少要做两件事：

1. 解析当前 template 依赖的 workspace 包
2. 用本次已发布版本替换为真实 semver

## 推荐脚本设计

当前最小落地方案先实现 2 类脚本，Tag / Release 继续由后续流水线增强补齐。

### 1. 导出脚本

建议名称：

- `scripts/template/export-template-repo.mjs`

职责：

1. 从 `apps/template-react` 拷贝模板文件到临时 staging 目录
2. 清理不应发布到模板仓库的文件
3. 改写 `package.json` 中的 workspace 依赖
4. 按目标环境注入 `.npmrc` 或安装说明
5. 输出模板导出结果清单

### 2. 同步脚本

建议名称：

- `scripts/template/sync-template-repo.mjs`

职责：

1. 接收 staging 目录
2. 克隆或更新模板仓库工作目录
3. 将导出内容覆盖到模板仓库
4. 生成变更摘要
5. 提交并推送到模板仓库指定分支

### 当前 GitHub 配置

源仓库当前需要以下 GitHub 配置：

1. Secret：`TEMPLATE_REPO_SYNC_SSH_KEY`
2. Variables：
   - `TEMPLATE_REPO_OWNER=gjxwxt`
   - `TEMPLATE_REPO_NAME=template-react-starter`
   - `TEMPLATE_REPO_BRANCH=main`
   - `PACKAGES_SCOPE=gjxwxt`

当前工作流分工：

1. `verify.yml`
   - 执行模板自身 `lint / typecheck / build / smoke`
   - 额外执行模板导出 dry-run
2. `release-github-packages.yml`
   - 只在 `Verify` 针对 `push main` 成功后，或手工触发时进入 release 链路
   - 如存在未消费 changeset，则只创建或更新 release PR
   - 如当前 commit 已进入正式发布阶段，则先完成 publish / tag / release，再执行模板同步 job

## 当前状态与内网缺口

截至 `2026-07-23`，模板独立仓库同步已具备 **GitHub 外网自动链路**，并补齐了 **GitLab 内网手工同步底座**，但内网侧还没有经过真实仓库和真实认证的最终联调。

当前事实：

1. `scripts/template/export-template-repo.mjs` 已支持 `--target github|gitlab` 双目标导出：
   - GitHub：`.npmrc.example` 指向 GitHub Packages，并生成 `.github/workflows/deploy-pages.yml`
   - GitLab：`.npmrc.example` 指向内网 Nexus，并改写 `README` 为内网安装说明
2. `scripts/template/sync-template-repo.mjs` 本身与 Git 平台耦合较低，可复用于 GitHub / GitLab，只要提供正确的仓库地址和认证方式即可。
3. `.gitlab-ci.yml` 已补齐两类模板相关 job：
   - `verify_template_export`：在 MR / develop / 默认分支做 GitLab 目标导出 dry-run
   - `sync_template_repo`：默认分支上的手工模板同步 job
4. GitLab 侧当前仍然保持“手工同步优先”，还没有把模板同步自动下挂到 `release` 之后。

因此，当前内网如果只是为了先跑通组件库发版到 Nexus：

1. 只需要配置 GitLab 变量
2. 不需要先建模板独立仓库

如果目标已经升级为“内网也要给业务方一个独立模板仓库”：

1. 需要新建内网模板仓库
2. 需要在 GitLab project / group 中配置模板同步变量和认证
3. 需要在真实内网 runner 上把 `verify_template_export` 与 `sync_template_repo` 各跑通一次

## 内外网统一方案（待实施）

### 核心原则

导出脚本和同步脚本应该是 **一套实现、两套目标配置**，而不是 GitHub 一份、GitLab 再复制一份。

建议统一采用：

1. 单一导出脚本：`scripts/template/export-template-repo.mjs`
2. 单一同步脚本：`scripts/template/sync-template-repo.mjs`
3. 通过 `--target <github|gitlab>` 切换产物语义

这样做的收益：

1. 避免两套模板导出逻辑长期漂移
2. 依赖改写、文件筛选、README 清洗只维护一份
3. 只有“仓库托管平台差异”和“包源差异”通过 target profile 处理

### 导出脚本改造计划

目标：让 `export-template-repo.mjs` 同时支持 GitHub 外网和 GitLab 内网。

#### Phase 1：抽出 target profile

将当前散落在脚本里的 GitHub 语义收口成 profile 配置，至少包含：

1. 包作用域：
   - GitHub：默认 `@<github-owner>/*`
   - GitLab：默认 `@cvicse/*`
2. 安装源说明：
   - GitHub：GitHub Packages
   - GitLab：Nexus `npm-zjj-group`
3. 模板仓库 CI 文件生成策略
4. README 注入文案
5. `.npmrc.example` 模板

建议接口：

```bash
node scripts/template/export-template-repo.mjs \
  --target github \
  --output .template-export \
  --repository gjxwxt/template-react-starter \
  --scope gjxwxt

node scripts/template/export-template-repo.mjs \
  --target gitlab \
  --output .template-export-internal \
  --repository infor/template-react-starter \
  --scope cvicse
```

#### Phase 2：按目标生成不同补充文件

GitHub 目标保持当前行为：

1. 生成 `.github/workflows/deploy-pages.yml`
2. 生成 GitHub Packages 版 `.npmrc.example`
3. 在 `README` 注入 GitHub Packages 安装准备说明

GitLab 目标新增行为：

1. 不生成 `.github/workflows/*`
2. 生成内网 Nexus 版 `.npmrc.example`
3. 在 `README` 注入“内网安装源 / 发布源 / 登录方式”说明
4. 可选生成模板仓库自己的 `.gitlab-ci.yml`

GitLab 版 `.npmrc.example` 建议指向：

```ini
registry=http://192.168.55.3:8081/repository/npm-zjj-group/
@cvicse:registry=http://192.168.55.3:8081/repository/npm-zjj-group/
```

#### Phase 3：README 注入逻辑双目标化

当前 `rewriteReadme` 假设模板仓库一定走 GitHub Packages，这会让内网模板仓库说明失真。

改造后要满足：

1. GitHub 版 README 继续强调 GitHub Packages
2. GitLab 版 README 改为强调内网 Nexus 安装
3. 两种 README 都说明模板仓库来自源仓库 `apps/template-react` 的单向同步

### 同步脚本复用策略

`sync-template-repo.mjs` 当前已经足够通用，不需要拆成两份。

保留统一脚本，只在调用层区分：

1. GitHub：
   - `git@github.com:<owner>/<repo>.git`
2. GitLab：
   - `git@gitlab.example.com:<group>/<repo>.git`
   - 或带 token 的 HTTPS 地址

需要补的是：

1. 文档明确支持 GitLab SSH / HTTPS token 两种认证
2. CI 变量命名统一，避免 GitHub / GitLab 两边各一套完全不同的概念

## 内网模板独立仓库实施计划

### Phase 0：先决条件

只有满足下面条件，才值得推进内网模板独立仓库：

1. 内网 `verify` 已稳定通过
2. 内网 `release` 已能真实发包到 Nexus
3. 业务方确实需要“独立模板仓库”而不是直接参考 monorepo 里的 `apps/template-react`

说明：

1. 如果还停留在“先把组件库包发出来”的阶段，不应优先做模板仓库同步
2. 否则会同时把变量、认证、仓库、脚本和 CI 风险叠在一起

### Phase 1：新建内网模板仓库

建议新建一个只承载发布镜像的内网仓库，例如：

1. `template-react-starter`
2. 默认分支：`main`
3. 禁止直接在该仓库做功能开发

仓库职责：

1. 对业务方提供模板起始基线
2. 只接收源仓库自动同步的结果
3. 独立维护模板仓库自己的 tag / release

### Phase 2：补 GitLab CI 变量

内网模板同步至少需要以下变量：

1. `TEMPLATE_SYNC_ENABLED=true`
2. `TEMPLATE_EXPORT_TARGET=gitlab`
3. `TEMPLATE_REPO_URL`
4. `TEMPLATE_REPO_BRANCH=main`
5. `TEMPLATE_PACKAGES_SCOPE=cvicse`

认证二选一：

1. SSH 方案：
   - `TEMPLATE_REPO_SYNC_SSH_KEY`
2. HTTPS Token 方案：
   - `TEMPLATE_REPO_SYNC_TOKEN`
   - `TEMPLATE_REPO_SYNC_USERNAME`

建议优先 SSH，原因：

1. 与当前 GitHub 外网实现思路一致
2. 不需要把 token 拼到命令行仓库地址里

### Phase 3：GitLab verify 增加模板导出 dry-run

在 `.gitlab-ci.yml` 增加一个非发布型校验 job，职责是证明：

1. `apps/template-react` 可以被成功导出成独立仓库
2. 导出后依赖改写、README 改写、补充文件生成都成立

建议 job 名：

1. `verify_template_export`

建议执行内容：

```bash
node scripts/template/export-template-repo.mjs \
  --target gitlab \
  --output .template-export-internal \
  --repository infor/template-react-starter \
  --scope cvicse \
  --dry-run
```

### Phase 4：GitLab release 下游增加模板同步

在 `.gitlab-ci.yml` 的 `release` 阶段后新增模板同步 job。

建议初版先做成：

1. 默认分支可手工触发
2. 依赖 `release` 成功
3. 仅在 `TEMPLATE_SYNC_ENABLED=true` 时出现

建议 job 名：

1. `sync_template_repo`

建议执行顺序：

1. 导出 GitLab 版模板 staging
2. 准备 SSH 或 HTTPS 认证
3. 调用 `scripts/template/sync-template-repo.mjs`
4. 输出变更摘要

建议初版先 **不自动触发**，原因：

1. 内网第一次接通时，认证和分支保护最容易出问题
2. 先让维护者手工触发一次，更容易排查

当手工链路稳定后，再考虑是否把它挂到 `release` job 成功后的自动下游。

### Phase 5：模板仓库自身的内网交付能力

内网模板仓库不一定要立即具备部署站点能力，但至少要具备：

1. 独立安装说明
2. 独立启动说明
3. 指向 Nexus 的 `.npmrc.example`
4. 真实版本号依赖，而不是 `workspace:*`

如后续确有需要，再决定是否补：

1. 模板仓库自己的 GitLab CI
2. GitLab Pages 或其他静态部署能力

## 推荐实施顺序

按风险从低到高，建议这样推进：

1. 先改 `export-template-repo.mjs`，支持 `github|gitlab` 双 target
2. 再补 GitLab 版 `verify_template_export`
3. 再建内网模板仓库并配置同步认证
4. 再补 `sync_template_repo` 手工 job
5. 最后视稳定性决定是否自动同步

原因：

1. 导出脚本双目标化是所有后续动作的基础
2. 没有 export dry-run，后面的同步失败会很难区分是“导出错了”还是“认证错了”
3. 没有先手工跑通，不适合直接上自动同步

## 推荐流水线分层

### 阶段 1：源仓库 Verify

触发时机：

1. `pull_request`
2. `push main`

职责：

1. `template-react` 自身 `lint / typecheck / build / smoke`
2. 组件库和模板协同验证

说明：

1. 这一步不负责同步模板仓库
2. 只负责证明 template 可交付
3. `push main` 的 Verify 成功结果，是后续 release 和 template sync 的唯一自动入口

### 阶段 2：源仓库 Release

触发时机：

1. `main` 上正式 release
2. 或手工触发模板 RC / stable 发布

职责：

1. 完成组件库版本确定
2. 产出可用于模板导出的真实依赖版本
3. 检查本次 release 是否包含 template 变更

建议产出：

1. `template-release-plan.json`
2. `published-package-versions.json`

### 阶段 3：模板导出与同步

触发条件：

1. 本次 release plan 判断 `templateChanged = true`

职责：

1. 执行模板导出
2. 改写真实依赖版本
3. 推送到模板仓库

建议目标分支：

1. `main`
2. `release/0.1`

### 阶段 4：模板仓库 Tag / Release

职责：

1. 为模板仓库打模板专属 tag
2. 生成模板 release note
3. 标明本次模板绑定的组件库版本

## Tag 与版本规则

模板仓库不要使用组件库主 tag 规则，建议固定前缀：

### RC

- `template-react-v0.1.0-rc.1`
- `template-react-v0.1.0-rc.2`

### Stable

- `template-react-v0.1.0`
- `template-react-v0.1.1`

Release note 中建议固定写明：

1. 模板版本
2. 绑定的组件库版本
3. 接入模式
4. 已知边界

## 分支策略

### 源仓库

1. `develop`：日常开发
2. `main`：发布主线

### 模板仓库

1. `main`：当前稳定线
2. `release/x.y`：RC 或维护线
3. `hotfix/x.y.z`：只在必要时短期存在

## 热修复策略

如果业务方在模板仓库发现 bug，优先顺序必须是：

1. 先在源仓库修复 `apps/template-react`
2. 跑源仓库验证
3. 重新导出并同步模板仓库
4. 在模板仓库打新的 patch tag

只有在极端紧急情况下，才允许模板仓库先打 hotfix。

但即便如此，也必须补一条强规则：

- **模板仓库的 hotfix 必须回灌到源仓库**

否则后续下次导出时会被源仓库覆盖掉。

## 业务方使用方式

业务方不要直接在源仓库里开发，也不要长期跟踪模板仓库主线。

推荐流程：

1. 业务方选择模板 tag
2. 基于该 tag 初始化自己的业务仓库
3. 按业务需要接入 mock / real
4. 后续模板有补丁时，由业务方按需 cherry-pick 或升级

也就是说，模板仓库是：

- **初始化起点**

不是：

- **业务项目的长期上游主分支**

## 推荐实现顺序

为了避免过早双仓增加负担，建议按下面顺序落地：

### 第一步

先在当前 monorepo 中把 template 收口到 `internal RC`：

1. `release-integration-ready`
2. `release-publishing-ready`

### 第二步

补模板导出脚本，并先跑本地 dry-run：

1. 导出 staging 目录
2. 改写依赖
3. 校验导出结果能独立启动

### 第三步

接 GitHub / GitLab 自动同步：

1. release 时判断是否触发模板同步
2. 自动推到模板仓库
3. 自动打模板 tag / release

当前外网已经先把“自动导出 + 自动同步仓库”这两步落地，模板 tag / release 仍然保留为下一阶段增强项。
同时外网链路已改为严格顺序：`PR -> Verify -> merge main -> Verify(push main) -> Release -> Template Sync`。

### 第四步

让 1 到 2 个业务项目基于模板仓库试点，验证流程是否成立。

## 最小可执行验收标准

当以下条件同时满足时，认为模板单向同步方案落地：

1. 可以从 `apps/template-react` 自动导出模板仓库内容
2. 导出后的模板仓库能独立安装、启动、构建
3. 模板依赖已从 workspace 改写为真实版本
4. 模板仓库 tag 规则与组件库主 tag 规则已区分
5. 至少完成一次从源仓库到模板仓库的自动同步演练

## 决策总结

最终推荐方案不是“双仓双向维护”，而是：

1. 单仓研发
2. 发布时导出
3. 自动同步到模板仓库
4. 模板仓库只做业务交付入口

这是当前阶段维护成本最低、后续演进空间也最大的方案。
