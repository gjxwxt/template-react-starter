# Docs Index

这个目录只放“长期有效、值得 AI 每次读”的模板文档，不放临时任务记录。

## 推荐阅读顺序

1. `PRODUCT.md`
2. `ARCHITECTURE.md`
3. `PROJECT_STRUCTURE.md`
4. `ROUTING_AND_PERMISSIONS.md`
5. `RELEASE_PLAN.md`
6. `TEMPLATE_REPO_SYNC.md`
7. `AI_WORKFLOW.md`

## 文档职责

- `PRODUCT.md`：模板定位、目标用户、边界、不做什么
- `ARCHITECTURE.md`：目录结构、运行时数据流、壳层分层
- `PROJECT_STRUCTURE.md`：页面、模块、组件、入口、状态和工具函数的统一落位规则
- `ROUTING_AND_PERMISSIONS.md`：本地路由、服务端菜单树、权限码适配规则
- `RELEASE_PLAN.md`：收口、验证、接入、发布阶段的执行顺序、验收口径和协作规则
- `TEMPLATE_REPO_SYNC.md`：模板从 monorepo 单向同步到独立模板仓库的发布架构与职责边界
- `AI_WORKFLOW.md`：注释格式、编辑清单、验证要求、交接规范

## 维护规则

- 行为变化先改代码，再同步相关文档
- 临时任务状态写 `progress.md`，不要写进这里
- 文档冲突时，以代码现状为准，并尽快修正文档
