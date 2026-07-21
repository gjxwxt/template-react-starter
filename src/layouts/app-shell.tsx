import React from 'react';
import { CloseOutlined, GlobalOutlined } from '@ant-design/icons';
import { Dropdown, message } from 'antd';
import type { MenuProps } from 'antd';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';

import {
  HeaderTags,
  ProButton,
  ProConfigProvider,
  ProNavigation,
  SideBar,
  type HeaderTagRoute,
  proThemePresets,
} from '@gjxwxt/react-components';
import { getCurrentShellContext } from '../api';
import { ApiError } from '../api/core';
import { useAppContext } from '../app/providers';
import {
  appSidebarGroups,
  appRoutes,
  getAccessibleRoutes,
  getDefaultRoutePath,
  getRouteLabel,
} from '../app/router';
import { templateAppConfig } from '../app/config';
import { readVisitedTabs, writeVisitedTabs, type AppThemeKey } from '../app/session';
import { AccountCenterDialog } from '../components/account-center-dialog';

const isDefined = <T,>(value: T | null | undefined): value is T => value != null;
const isAppThemeKey = (value: string): value is AppThemeKey =>
  value === 'brand' || value === 'light' || value === 'dark';

const arePathsEqual = (left: string[], right: string[]) => {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
};

const buildSidebarStyle = (themeKey: AppThemeKey): React.CSSProperties => {
  const presetVariables = proThemePresets[themeKey]?.cssVariables || {};
  const sidebarVariables = Object.entries(presetVariables).reduce<Record<string, string>>(
    (accumulator, [name, value]) => {
      if (!name.startsWith('--cvicse-theme-sidebar-')) {
        return accumulator;
      }

      accumulator[name] = String(value);
      return accumulator;
    },
    {},
  );

  return {
    ...sidebarVariables,
    height: '100%',
    background:
      sidebarVariables['--cvicse-theme-sidebar-bg'] ||
      (themeKey === 'dark' ? '#0c2445' : themeKey === 'brand' ? '#1171ff' : '#ffffff'),
  } as React.CSSProperties;
};

export const AppShell: React.FC = () => {
  const {
    collapsed,
    locale,
    logout,
    session,
    setCollapsed,
    setLocale,
    setThemeKey,
    t,
    themeKey,
    updateSession,
  } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpenKeys, setSidebarOpenKeys] = React.useState<string[]>([]);
  const [visitedPaths, setVisitedPaths] = React.useState<string[]>(() => readVisitedTabs());
  const [accountDialogOpen, setAccountDialogOpen] = React.useState(false);
  const [isCompact, setIsCompact] = React.useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.innerWidth <= 960;
  });
  const contextHydrationRef = React.useRef<string>('');
  const useServerNavigation = templateAppConfig.features.navigationMode === 'server';

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const syncCompact = () => {
      setIsCompact(window.innerWidth <= 960);
    };

    syncCompact();
    window.addEventListener('resize', syncCompact);

    return () => {
      window.removeEventListener('resize', syncCompact);
    };
  }, []);

  React.useEffect(() => {
    if (!session) {
      contextHydrationRef.current = '';
      return;
    }

    if (!useServerNavigation) {
      return;
    }

    const hydrationKey = `${session.loginName}:${session.token}`;

    if (contextHydrationRef.current === hydrationKey) {
      return;
    }

    contextHydrationRef.current = hydrationKey;
    let cancelled = false;

    void (async () => {
      try {
        // 服务端导航刷新只更新壳层数据，不重建登录会话本身。
        const nextContext = await getCurrentShellContext();

        if (cancelled) {
          return;
        }

        updateSession({
          allowedRouteIds: nextContext.allowedRouteIds,
          department: nextContext.department,
          displayName: nextContext.displayName,
          email: nextContext.email,
          navigationGroups: nextContext.navigationGroups,
          permissionCodes: nextContext.permissionCodes,
          phone: nextContext.phone,
          role: nextContext.role,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        contextHydrationRef.current = '';

        if (!(error instanceof ApiError && error.status === 401)) {
          message.warning(t.shell.navigationSyncFailed);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session, t.shell.navigationSyncFailed, updateSession, useServerNavigation]);

  const accessibleRoutes = React.useMemo(() => {
    return getAccessibleRoutes(session);
  }, [session]);

  // 这两张映射表让后端菜单名称和分组覆盖本地默认值，但不改动路由注册。
  const serverRouteGroupKeyMap = React.useMemo(() => {
    const groupKeyMap = new Map<string, string>();

    session?.navigationGroups?.forEach((group) => {
      group.routeIds.forEach((routeId) => {
        groupKeyMap.set(routeId, group.key);
      });
    });

    return groupKeyMap;
  }, [session?.navigationGroups]);

  const serverRouteLabelMap = React.useMemo(() => {
    const labelMap = new Map<string, string>();

    session?.navigationGroups?.forEach((group) => {
      group.items?.forEach((item) => {
        if (item.label) {
          labelMap.set(item.routeId, item.label);
        }
      });
    });

    return labelMap;
  }, [session?.navigationGroups]);

  const resolveRouteDisplayLabel = React.useCallback(
    (route: (typeof appRoutes)[number]) => {
      return serverRouteLabelMap.get(route.id) ?? getRouteLabel(route, t);
    },
    [serverRouteLabelMap, t],
  );

  const currentRoute =
    accessibleRoutes.find((route) => route.path === location.pathname) ??
    appRoutes.find((route) => route.path === location.pathname);

  const currentGroup =
    (currentRoute ? serverRouteGroupKeyMap.get(currentRoute.id) : undefined) ??
    currentRoute?.sidebarGroup ??
    'groupWorkbench';
  const mergedCollapsed = collapsed || isCompact;
  const currentPageLabel = currentRoute ? resolveRouteDisplayLabel(currentRoute) : t.menuDashboard;
  const defaultTabPath = getDefaultRoutePath(accessibleRoutes);
  const accessiblePathSet = React.useMemo(
    () => new Set(accessibleRoutes.map((route) => route.path)),
    [accessibleRoutes],
  );
  const sidebarThemeStyle = React.useMemo(() => buildSidebarStyle(themeKey), [themeKey]);

  React.useEffect(() => {
    if (mergedCollapsed) {
      return;
    }

    setSidebarOpenKeys((currentKeys) => {
      return currentKeys.includes(currentGroup) ? currentKeys : [...currentKeys, currentGroup];
    });
  }, [currentGroup, mergedCollapsed]);

  React.useEffect(() => {
    setVisitedPaths((currentPaths) => {
      const filteredPaths = currentPaths.filter((path) => accessiblePathSet.has(path));
      const normalizedPaths = defaultTabPath
        ? [defaultTabPath, ...filteredPaths.filter((path) => path !== defaultTabPath)]
        : filteredPaths;

      return arePathsEqual(currentPaths, normalizedPaths) ? currentPaths : normalizedPaths;
    });
  }, [accessiblePathSet, defaultTabPath]);

  React.useEffect(() => {
    if (!currentRoute?.path) {
      return;
    }

    setVisitedPaths((currentPaths) => {
      const normalizedPaths = defaultTabPath
        ? [defaultTabPath, ...currentPaths.filter((path) => path !== defaultTabPath)]
        : currentPaths;

      if (normalizedPaths.includes(currentRoute.path)) {
        return normalizedPaths;
      }

      return [...normalizedPaths, currentRoute.path];
    });
  }, [currentRoute?.path, defaultTabPath]);

  React.useEffect(() => {
    // 已访问页签放在壳层持久化，页面组件保持无状态更容易复用。
    writeVisitedTabs(visitedPaths);
  }, [visitedPaths]);

  const sidebarItems = React.useMemo(() => {
    const groupLabelMap = new Map<string, string>(
      appSidebarGroups.map((group) => [group.key, String(t[group.labelKey])] as const),
    );

    if (useServerNavigation && session?.navigationGroups && session.navigationGroups.length > 0) {
      return session.navigationGroups
        .map((group) => {
          const groupItems: Array<{ label?: string; routeId: string }> =
            group.items ?? group.routeIds.map((routeId) => ({ routeId }));
          // 即使走服务端菜单模式，侧边栏仍然只渲染当前可访问的本地页面。
          const routes = groupItems
            .map((item) => {
              const route = accessibleRoutes.find((candidate) => candidate.id === item.routeId);

              if (!route) {
                return null;
              }

              return {
                key: route.path,
                icon: route.icon,
                label: item.label ?? resolveRouteDisplayLabel(route),
              };
            })
            .filter(isDefined);

          if (routes.length === 0) {
            return null;
          }

          return {
            key: group.key,
            icon: routes[0].icon,
            label: group.label ?? groupLabelMap.get(group.key) ?? group.key,
            children: routes,
          };
        })
        .filter(isDefined) as NonNullable<MenuProps['items']>;
    }

    return appSidebarGroups
      .map((group) => {
        const routes = accessibleRoutes.filter((route) => route.sidebarGroup === group.key);
        if (routes.length === 0) {
          return null;
        }

        return {
          key: group.key,
          icon: routes[0].icon,
          label: String(t[group.labelKey]),
          children: routes.map((route) => ({
            key: route.path,
            icon: route.icon,
            label: resolveRouteDisplayLabel(route),
          })),
        };
      })
      .filter(isDefined) as NonNullable<MenuProps['items']>;
  }, [
    accessibleRoutes,
    resolveRouteDisplayLabel,
    session?.navigationGroups,
    t,
    useServerNavigation,
  ]);

  const headerTagRoutes = visitedPaths
    .map((path) => {
      const targetRoute =
        accessibleRoutes.find((route) => route.path === path) ??
        appRoutes.find((route) => route.path === path);

      if (!targetRoute) {
        return null;
      }

      return {
        path: targetRoute.path,
        title: resolveRouteDisplayLabel(targetRoute),
        icon: targetRoute.icon,
        affix: targetRoute.path === defaultTabPath,
      } satisfies HeaderTagRoute;
    })
    .filter(isDefined);

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <ProConfigProvider locale={locale} themeKey="light">
      <div className="template-shell">
        <aside className="template-shell__sidebar">
          <SideBar
            className="template-sidebar"
            items={sidebarItems}
            selectedKey={currentRoute?.path}
            collapsed={mergedCollapsed}
            openKeys={mergedCollapsed ? [] : sidebarOpenKeys}
            onSelect={(path) => navigate(path)}
            onOpenChange={setSidebarOpenKeys}
            onCollapsedChange={setCollapsed}
            width={240}
            collapsedWidth={76}
            title={t.shellBrandTitle}
            icon={
              <img
                className="template-sidebar__brand-logo"
                src={templateAppConfig.branding.shellLogoSrc}
                alt={templateAppConfig.branding.shellLogoAlt}
              />
            }
            dataTestid="template-sidebar"
            dimensions={{
              borderRadius: 0,
              headerMinHeight: 56,
              headerPaddingBlock: 0,
              headerPaddingInlineStart: 18,
              headerPaddingInlineEnd: 14,
              headerCollapsedPaddingInlineEnd: 0,
              headerContentGap: 10,
              menuPaddingBlock: 0,
              menuItemHeight: 44,
              subMenuItemHeight: 40,
              menuItemBorderRadius: 10,
              menuIconGap: 10,
              headerIconWidth: templateAppConfig.branding.shellLogoWidth,
              headerIconHeight: templateAppConfig.branding.shellLogoHeight,
              collapsedIconWidth: templateAppConfig.branding.shellCollapsedLogoWidth,
              collapsedIconHeight: templateAppConfig.branding.shellCollapsedLogoHeight,
              titleFontSize: 15,
              footerPaddingInlineStart: 20,
              footerToggleSize: 36,
              footerToggleMinHeight: 36,
              footerToggleBorderRadius: 10,
            }}
            style={sidebarThemeStyle}
          />
        </aside>

        <div className="template-shell__main">
          <header className="template-shell__header">
            <ProNavigation
              leftContent={
                <div className="template-navigation__context">
                  <span className="template-navigation__label">{t.shell.currentLocation}</span>
                  <span className="template-navigation__slash">/</span>
                  <span className="template-navigation__value">{currentPageLabel}</span>
                </div>
              }
              showMenu={false}
              headerBgColor="#ffffff"
              currentThemeKey={themeKey}
              actions={[
                {
                  key: 'refresh',
                  type: 'refresh',
                  onClick: () => {
                    window.location.reload();
                  },
                },
                { key: 'fullScreen', type: 'fullScreen' },
                { key: 'theme', type: 'theme' },
              ]}
              themeOptions={[
                { key: 'brand', label: t.themeLabels.brand },
                { key: 'light', label: t.themeLabels.light },
                { key: 'dark', label: t.themeLabels.dark },
              ]}
              onThemeChange={(nextTheme) => {
                if (isAppThemeKey(nextTheme)) {
                  setThemeKey(nextTheme);
                }
              }}
              user={{
                name: `${session.displayName} / ${t.roleLabels[session.role]}`,
                menuItems: [
                  { key: 'account-center', label: t.accountCenter },
                  { key: 'logout', label: t.logout, danger: true },
                ],
                onMenuClick: (key) => {
                  if (key === 'account-center') {
                    setAccountDialogOpen(true);
                    return;
                  }

                  if (key === 'logout') {
                    logout();
                    navigate('/login');
                  }
                },
              }}
              rightExtra={
                templateAppConfig.features.enableLocaleSwitch ? (
                  <Dropdown
                    menu={{
                      items: [
                        { key: 'zh-CN', label: '🇨🇳 中文' },
                        { key: 'en-US', label: '🇺🇸 English' },
                      ],
                      onClick: ({ key }) => {
                        setLocale(key as typeof locale);
                      },
                      selectedKeys: [locale],
                    }}
                    trigger={['click']}
                    placement="bottomRight"
                  >
                    <ProButton type="text" size="small" icon={<GlobalOutlined />}>
                      {locale}
                    </ProButton>
                  </Dropdown>
                ) : null
              }
            />

            <div className="template-shell__tabs">
              <HeaderTags
                className="template-shell__header-tags"
                routes={headerTagRoutes}
                activePath={currentRoute?.path}
                overflowMode="buttons"
                defaultActivePath={defaultTabPath}
                onTabClick={(path) => {
                  navigate(path);
                }}
                onRoutesChange={(nextRoutes) => {
                  setVisitedPaths(nextRoutes.map((route) => route.path));
                }}
                showCloseButtonAlways={false}
                enableContextMenu
                tabMaxWidth={180}
                renderMore={({ closeByCommand, defaultNode }) => {
                  return (
                    <div className="template-shell__tabs-more">
                      {defaultNode}
                      <ProButton
                        type="text"
                        size="small"
                        icon={<CloseOutlined />}
                        onClick={() => closeByCommand('closeOtherTabs')}
                      >
                        {t.shell.closeOthers}
                      </ProButton>
                    </div>
                  );
                }}
              />
            </div>
          </header>

          <main className="template-shell__content">
            <div className="template-shell__content-inner">
              <Outlet />
            </div>
          </main>

          <footer className="template-shell__footer">{t.shell.footer}</footer>
        </div>
      </div>
      <AccountCenterDialog
        open={accountDialogOpen}
        session={session}
        onClose={() => setAccountDialogOpen(false)}
      />
    </ProConfigProvider>
  );
};
