# Smoke Testing

本模板工程内置了基于 [Playwright](https://playwright.dev/) 的端到端（E2E）基础链路验证，用于在发布前保证模板核心功能可用。

## 验证范围

当前 Smoke Test 主要覆盖以下核心能力：

- 登录态获取与壳层初始化
- 导航菜单展开与路由切换
- 页面多页签（Tabs）打开与切换
- 异常路由捕获（404 页）
- 系统管理基础母版页的展示（用户、角色、部门、字典）

> 💡 **提示**：测试用例位于 `e2e/smoke.spec.cjs`。

## 运行方式

Smoke Test 已经被集成到了统一初始化脚本中，你可以通过以下方式运行：

### 方式一：完整链路验证（推荐）

在模板项目根目录运行；在 monorepo 研发态下，这个目录通常是 `apps/template-react`：

```bash
./init.sh
```

此命令会依次执行 `lint` -> `typecheck` -> `build` -> `smoke`，是发布前最可靠的质量门禁。

### 方式二：单独运行测试

如果你只修改了部分 UI 或想快速验证，可以直接运行：

```bash
pnpm smoke
```

此命令会自动启动本地开发服务器并执行 Playwright 用例，执行完毕后自动关闭服务器。

## 常见问题

**Q: 登录页有验证码，自动化测试如何绕过的？**

为了保证测试稳定性并避免外挂 OCR，模板在 `src/pages/auth/login/page.tsx` 中预留了本地测试后门。当环境变量 `import.meta.env.DEV` 为真且输入验证码为 `0000` 时，强制视为图形验证码正确。

**Q: 执行 `pnpm smoke` 失败，提示缺少浏览器？**

如果是初次在当前机器运行，可能需要手动安装 Playwright 依赖的浏览器二进制文件：

```bash
pnpm exec playwright install
```
