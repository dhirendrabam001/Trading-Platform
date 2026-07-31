const BASE_URL = import.meta.env.VITE_API_URL;

export const USER_API_END_POINT = `${BASE_URL}/api/user`;

export const USER_APP_URL = import.meta.env.VITE_USER_APP_URL;

export const ADMIN_APP_URL = import.meta.env.VITE_ADMIN_APP_URL;

export const dashboardUrlForRole = (role) =>
  role === "admin" ? ADMIN_APP_URL : USER_APP_URL;
