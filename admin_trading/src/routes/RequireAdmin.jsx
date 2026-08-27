import { useEffect } from "react";
import { THEME_APP_URL, USER_APP_URL } from "../apis/apis";
import useAuthSession from "../hooks/useAuthSession";

const ALLOWED_ROLE = "admin";

/**
 * Gates the admin console behind a confirmed admin session.
 *
 * Two distinct failures are handled differently:
 *   - no session at all  -> the login page
 *   - a signed-in *user* -> their own dashboard, not the login page, since
 *     they are authenticated and bouncing them to login would just loop
 */
const RequireAdmin = ({ children }) => {
  const { status, user } = useAuthSession();
  const checking = status === "checking";
  const allowed = status === "authed" && user?.role === ALLOWED_ROLE;

  useEffect(() => {
    // Never redirect while the check is in flight, or an admin refreshing
    // the page is thrown out to login every time.
    if (checking || allowed) return;

    const target =
      status === "authed" && user?.role === "user" && USER_APP_URL
        ? USER_APP_URL
        : `${THEME_APP_URL}/login`;

    // replace() so Back cannot return to a screen this visitor was never
    // allowed to see.
    window.location.replace(target);
  }, [checking, allowed, status, user]);

  if (allowed) return children;

  // Renders nothing at all until the session is confirmed — no flash of the
  // admin console ahead of the redirect.
  return null;
};

export default RequireAdmin;
