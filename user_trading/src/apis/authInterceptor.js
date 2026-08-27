import axios from "axios";
import { THEME_APP_URL } from "./apis";

// One redirect only. Several requests can fail together — a page that fires
// three calls on mount would otherwise try to navigate three times.
let redirecting = false;

/**
 * Sends the visitor to the login page the moment the API rejects a session.
 *
 * RequireAuth covers the entry check — "can this person open the dashboard
 * at all". This covers everything after it: the cookie has a 24 hour life,
 * so a session can expire, be revoked, or be cleared while the tab is still
 * open. Without this, the app keeps rendering a dashboard whose every
 * request is failing with 401.
 */
export const installAuthInterceptor = () => {
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error?.response?.status === 401 && !redirecting) {
        redirecting = true;
        window.location.replace(`${THEME_APP_URL}/login`);
      }

      // Re-thrown so callers still see the failure and can stop their own
      // loading states rather than hanging.
      return Promise.reject(error);
    },
  );
};

export default installAuthInterceptor;
