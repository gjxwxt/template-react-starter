const { test, expect } = require('@playwright/test');

test.describe('Template React Smoke Test', () => {
  test.beforeEach(async ({ page }) => {
    // 强制视口大小，确保菜单栏正常展示
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test('main smoke flow', async ({ page }) => {
    // 1. 登录链路
    await page.goto('/');
    // 会重定向到登录页
    await expect(page).toHaveURL(/.*\/login/);

    // 填写登录表单
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', '12345678a');
    // 使用开发环境后门绕过图形验证码
    await page.fill('input[placeholder="请输入验证码"]', '0000');
    await page.click('button:has-text("登 录")');

    // 登录后重定向到主页 (dashboard)
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator('text=工作台').first()).toBeVisible();

    // 2. 侧边栏展开/收起和多页签切换
    // 点击系统管理菜单（如果未展开）
    const sysMenu = page.locator('text=系统管理');
    await sysMenu.click();

    // 导航到任务列表
    await page.locator('text=任务列表').click();
    await expect(page).toHaveURL(/.*\/tasks/);
    await expect(page.locator('text=任务列表').first()).toBeVisible();

    // 导航到用户管理
    await page.locator('text=用户管理').click();
    await expect(page).toHaveURL(/.*\/system\/users/);
    // 检查页签是否增加了用户管理
    await expect(page.locator('[data-header-tag-path="/system/users"]')).toBeVisible();

    // 导航到角色管理
    await page.locator('text=角色管理').click();
    await expect(page).toHaveURL(/.*\/system\/roles/);

    // 导航到部门管理
    await page.locator('text=部门管理').click();
    await expect(page).toHaveURL(/.*\/system\/departments/);

    // 导航到字典管理
    await page.locator('text=字典管理').click();
    await expect(page).toHaveURL(/.*\/system\/dictionaries/);

    // 切换回任务列表页签
    await page.locator('[data-header-tag-path="/tasks"]').click();
    await expect(page).toHaveURL(/.*\/tasks/);

    // 3. 异常页链路
    await page.goto('/some-non-existent-route-12345');
    await expect(page.locator('text=页面不存在或已经被移动。')).toBeVisible();
    await page.locator('text=回到首页').click();
    await expect(page).toHaveURL(/.*\/dashboard/);
  });
});
