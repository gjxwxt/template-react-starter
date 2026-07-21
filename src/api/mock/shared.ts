export const wait = (ms = 240) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

export const createId = (prefix: string) => `${prefix}-${Date.now().toString(36)}`;
