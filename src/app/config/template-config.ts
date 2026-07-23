const parseBooleanEnv = (value: string | undefined, fallback: boolean) => {
  if (value == null || value.trim() === '') {
    return fallback;
  }

  return value === '1' || value.toLowerCase() === 'true';
};

const parseNavigationMode = (value: string | undefined) => {
  return value === 'server' ? 'server' : 'local';
};

const normalizePublicBasePath = (value: string | undefined) => {
  const trimmed = value?.trim();

  if (!trimmed || trimmed === '/') {
    return '/';
  }

  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`;
};

// Pages 这类子路径部署场景下，路由 basename 和静态资源前缀必须共用同一份基准。
export const templatePublicBasePath = normalizePublicBasePath(import.meta.env.BASE_URL);

export const templateRouterBasename =
  templatePublicBasePath === '/' ? undefined : templatePublicBasePath.replace(/\/$/, '');

export const resolveTemplateAssetPath = (assetPath: string) => {
  const normalizedAssetPath = assetPath.replace(/^\/+/, '');
  return `${templatePublicBasePath}${normalizedAssetPath}`;
};

export interface TemplateAppConfig {
  api: {
    baseUrl: string;
    timeoutMs: number;
    useMock: boolean;
  };
  auth: {
    forbiddenPath: string;
    homePath: string;
    loginPath: string;
    notFoundPath: string;
    serverErrorPath: string;
    tokenScheme: string;
  };
  branding: {
    logoAlt: string;
    logoSrc: string;
    // 侧栏 header 使用独立 logo，避免替换壳层品牌时影响登录页视觉。
    shellLogoAlt: string;
    shellLogoSrc: string;
    shellLogoWidth: number;
    shellLogoHeight: number;
    shellCollapsedLogoWidth: number;
    shellCollapsedLogoHeight: number;
  };
  features: {
    enableLocaleSwitch: boolean;
    navigationMode: 'local' | 'server';
  };
}

export const templateAppConfig: TemplateAppConfig = {
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL?.trim() || '/api',
    timeoutMs: 10000,
    useMock: parseBooleanEnv(import.meta.env.VITE_API_MOCK, true),
  },
  auth: {
    forbiddenPath: '/403',
    homePath: '/dashboard',
    loginPath: '/login',
    notFoundPath: '/404',
    serverErrorPath: '/500',
    tokenScheme: 'Bearer',
  },
  branding: {
    logoAlt: 'CVICSE',
    logoSrc: resolveTemplateAssetPath('png/cvicse-logo.png'),
    shellLogoAlt: 'INFORS',
    shellLogoSrc: resolveTemplateAssetPath('png/infors-sidebar-favicon.png'),
    shellLogoWidth: 69,
    shellLogoHeight: 24,
    shellCollapsedLogoWidth: 56,
    shellCollapsedLogoHeight: 20,
  },
  features: {
    enableLocaleSwitch: parseBooleanEnv(import.meta.env.VITE_TEMPLATE_ENABLE_LOCALE_SWITCH, false),
    navigationMode: parseNavigationMode(import.meta.env.VITE_TEMPLATE_NAVIGATION_MODE),
  },
};
