const SESSION_EXPIRED_EVENT = 'cvicse-template-react:session-expired';

interface SessionExpiredDetail {
  message?: string;
}

export const emitSessionExpired = (detail?: SessionExpiredDetail) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent<SessionExpiredDetail>(SESSION_EXPIRED_EVENT, { detail }));
};

export const subscribeSessionExpired = (handler: (detail: SessionExpiredDetail) => void) => {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const listener = (event: Event) => {
    handler((event as CustomEvent<SessionExpiredDetail>).detail ?? {});
  };

  window.addEventListener(SESSION_EXPIRED_EVENT, listener);

  return () => {
    window.removeEventListener(SESSION_EXPIRED_EVENT, listener);
  };
};
