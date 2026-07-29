const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const USER_API_END_POINT = `${BASE_URL}/api/user`;

// Post-login redirect targets. Each dashboard is a separate app on its own
// origin, so these are absolute URLs rather than router paths.
export const USER_APP_URL =
  import.meta.env.VITE_USER_APP_URL || "http://localhost:5174";

export const ADMIN_APP_URL =
  import.meta.env.VITE_ADMIN_APP_URL || "http://localhost:5175";

export const dashboardUrlForRole = (role) =>
  role === "admin" ? ADMIN_APP_URL : USER_APP_URL;
