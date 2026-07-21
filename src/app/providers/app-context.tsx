import React from 'react';
import { message } from 'antd';

import { appTexts, type AppText } from '../i18n';
import {
  clearSession,
  readCollapsed,
  readLocale,
  readSession,
  readThemeKey,
  subscribeSessionExpired,
  writeCollapsed,
  writeLocale,
  writeSession,
  writeThemeKey,
  type AppLocaleKey,
  type AppSession,
  type AppThemeKey,
} from '../session';

interface AppContextValue {
  collapsed: boolean;
  locale: AppLocaleKey;
  session: AppSession | null;
  t: AppText;
  themeKey: AppThemeKey;
  login: (session: AppSession) => void;
  logout: () => void;
  setCollapsed: (collapsed: boolean) => void;
  setLocale: (locale: AppLocaleKey) => void;
  setThemeKey: (themeKey: AppThemeKey) => void;
  updateSession: (patch: Partial<AppSession>) => void;
}

const AppContext = React.createContext<AppContextValue>({
  collapsed: false,
  locale: 'zh-CN',
  session: null,
  t: appTexts['zh-CN'],
  themeKey: 'brand',
  login: () => undefined,
  logout: () => undefined,
  setCollapsed: () => undefined,
  setLocale: () => undefined,
  setThemeKey: () => undefined,
  updateSession: () => undefined,
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = React.useState<AppSession | null>(() => readSession());
  const [locale, setLocaleState] = React.useState<AppLocaleKey>(() => readLocale() ?? 'zh-CN');
  const [themeKey, setThemeKeyState] = React.useState<AppThemeKey>(() => readThemeKey() ?? 'brand');
  const [collapsed, setCollapsedState] = React.useState<boolean>(() => readCollapsed());

  const t = appTexts[locale];

  const login = React.useCallback((nextSession: AppSession) => {
    writeSession(nextSession);
    setSession(nextSession);
  }, []);

  React.useEffect(() => {
    return subscribeSessionExpired((detail) => {
      clearSession();
      setSession(null);
      message.warning(detail.message || t.shell.sessionExpired);
    });
  }, [t.shell.sessionExpired]);

  const logout = React.useCallback(() => {
    clearSession();
    setSession(null);
    message.success(locale === 'zh-CN' ? '已退出登录。' : 'Logged out.');
  }, [locale]);

  const updateSession = React.useCallback((patch: Partial<AppSession>) => {
    setSession((currentSession) => {
      if (!currentSession) {
        return currentSession;
      }

      const nextSession = {
        ...currentSession,
        ...patch,
      };

      writeSession(nextSession);
      return nextSession;
    });
  }, []);

  const setLocale = React.useCallback((nextLocale: AppLocaleKey) => {
    writeLocale(nextLocale);
    setLocaleState(nextLocale);
  }, []);

  const setThemeKey = React.useCallback((nextThemeKey: AppThemeKey) => {
    writeThemeKey(nextThemeKey);
    setThemeKeyState(nextThemeKey);
  }, []);

  const setCollapsed = React.useCallback((nextCollapsed: boolean) => {
    writeCollapsed(nextCollapsed);
    setCollapsedState(nextCollapsed);
  }, []);

  const value = React.useMemo(
    () => ({
      collapsed,
      locale,
      session,
      t,
      themeKey,
      login,
      logout,
      setCollapsed,
      setLocale,
      setThemeKey,
      updateSession,
    }),
    [
      collapsed,
      locale,
      login,
      logout,
      session,
      setCollapsed,
      setLocale,
      setThemeKey,
      t,
      themeKey,
      updateSession,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => React.useContext(AppContext);
