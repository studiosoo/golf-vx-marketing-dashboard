export function getLoginUrl(returnPath?: string): string {
  const state = encodeURIComponent(
    JSON.stringify({
      origin: window.location.origin,
      returnPath: returnPath || window.location.pathname,
    })
  );
  return `${import.meta.env.VITE_OAUTH_PORTAL_URL}?app_id=${import.meta.env.VITE_APP_ID}&state=${state}`;
}
