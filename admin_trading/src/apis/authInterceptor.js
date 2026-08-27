import axios from "axios";
import { THEME_APP_URL } from "./apis";

// One redirect only, however many requests fail together
let redirecting = false;

/**
 * Sends the visitor to login the moment the API rejects a session.
 *
 * RequireAdmin covers the entry check. This covers everything after it: the
 * cookie has a 24 hour life, so a session can expire or be revoked while the
 * console is still open.
 */
export const installAuthInterceptor = () => {
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error?.response?.status === 401 && !redirecting) {
        redirecting = true;
        window.location.replace(`${THEME_APP_URL}/login`);
      }
      return Promise.reject(error);
    },
  );
};

export default installAuthInterceptor;
