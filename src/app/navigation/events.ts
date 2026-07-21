const NAVIGATION_EVENT = 'cvicse-template-react:navigate';

export interface NavigationEventDetail {
  path: string;
  replace?: boolean;
  state?: Record<string, unknown>;
}

export const emitNavigation = (detail: NavigationEventDetail) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent<NavigationEventDetail>(NAVIGATION_EVENT, { detail }));
};

export const subscribeNavigation = (handler: (detail: NavigationEventDetail) => void) => {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const listener = (event: Event) => {
    handler((event as CustomEvent<NavigationEventDetail>).detail);
  };

  window.addEventListener(NAVIGATION_EVENT, listener);

  return () => {
    window.removeEventListener(NAVIGATION_EVENT, listener);
  };
};
