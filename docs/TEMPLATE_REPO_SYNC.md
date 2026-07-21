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
