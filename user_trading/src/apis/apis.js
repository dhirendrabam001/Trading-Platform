const BASE_URL = import.meta.env.VITE_API_URL;

/* ============================================================ ENDPOINTS ===
   One constant per API group, so no component ever writes a raw URL.
   If a path changes on the server, it changes here once and nowhere else. */

export const USER_API_END_POINT = `${BASE_URL}/api/user`;
export const SESSION_API_END_POINT = `${BASE_URL}/api/session`;
export const MARKET_API_END_POINT = `${BASE_URL}/api/market`;
export const WALLET_API_END_POINT = `${BASE_URL}/api/wallet`;
export const ORDER_API_END_POINT = `${BASE_URL}/api/orders`;
export const PORTFOLIO_API_END_POINT = `${BASE_URL}/api/portfolio`;
export const NOTIFICATION_API_END_POINT = `${BASE_URL}/api/notifications`;
export const BANK_ACCOUNT_API_END_POINT = `${BASE_URL}/api/bank-accounts`;
export const SUPPORT_API_END_POINT = `${BASE_URL}/api/support`;
export const KYC_API_END_POINT = `${BASE_URL}/api/kyc`;

/* Live updates. http -> ws, https -> wss, so it follows the API automatically
   instead of needing its own environment variable. */
export const REALTIME_URL = `${String(BASE_URL).replace(/^http/, "ws")}/ws`;

/* ========================================================= OTHER APPS === */

export const THEME_APP_URL = import.meta.env.VITE_THEME_APP_URL;
export const USER_APP_URL = import.meta.env.VITE_USER_APP_URL;

export const ADMIN_APP_URL = import.meta.env.VITE_ADMIN_APP_URL;

export const dashboardUrlForRole = (role) =>
  role === "admin" ? ADMIN_APP_URL : USER_APP_URL;

export const LOGIN_URL = `${THEME_APP_URL}/login`;
