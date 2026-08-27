const KEY = "iqra:open-action";

export function requestAction(action: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(KEY, action);
  } catch {
    /* ignore */
  }
}

export function takeAction(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.sessionStorage.getItem(KEY);
    if (value) window.sessionStorage.removeItem(KEY);
    return value;
  } catch {
    return null;
  }
}
