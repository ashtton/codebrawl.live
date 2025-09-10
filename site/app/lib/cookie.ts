export function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") return;
  const encoded = encodeURIComponent(value);
  document.cookie = `${name}=${encoded}; Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}; Path=/; SameSite=Lax`;
}

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  for (const c of cookies) {
    const [k, v] = c.split("=");
    if (k === name) {
      try {
        return decodeURIComponent(v ?? "");
      } catch {
        return v ?? "";
      }
    }
  }
  return null;
}
