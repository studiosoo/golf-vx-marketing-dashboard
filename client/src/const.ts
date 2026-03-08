export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const VENUE_CONFIG = {
  name: "Golf VX Arlington Heights",
  shortName: "ARLINGTON HEIGHTS",
  address: "644 E Rand Rd, Arlington Heights, IL 60004",
  phone: "(847) 749-1054",
} as const;

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  if (!oauthPortalUrl || !appId) {
    return redirectUri;
  }

  const url = new URL("/app-auth", oauthPortalUrl);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
