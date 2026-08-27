import { useEffect } from "react";
import { useSelector } from "react-redux";
import { THEME_APP_URL, dashboardUrlForRole } from "../apis/apis";
import PageLoader from "../components/PageLoader/PageLoader";

// This app is the user dashboard, so only a "user" session belongs here.
const ALLOWED_ROLE = "user";

const loginUrl = () => `${THEME_APP_URL}/login`;

/**
 * Gates the entire dashboard behind a confirmed session.
 *
 * The session itself lives in an httpOnly cookie that JavaScript cannot read,
 * so "am I signed in?" is answered by the result of GET /getProfile, not by
 * anything in localStorage. `checking` is that request still being in flight.
 */
const RequireAuth = ({ checking, children }) => {
  const { user } = useSelector((store) => store.auth);
  const allowed = !checking && user?.role === ALLOWED_ROLE;

  useEffect(() => {
    // The most important line in this file: never redirect while the session
    // check is still running. Acting on a null user before /getProfile
    // answers would bounce every signed-in visitor to login on each refresh.
    if (checking || allowed) return;

    // Someone signed in as admin is authenticated, just in the wrong app —
    // send them to their own dashboard instead of back through login.
    const roleHome = user?.role ? dashboardUrlForRole(user.role) : null;

    // replace() rather than assign() so the browser's Back button cannot
    // return to a page this visitor was never allowed to see.
    window.location.replace(roleHome || loginUrl());
  }, [checking, allowed, user]);

  if (allowed) return children;

  // Nothing of the dashboard is rendered until the session is confirmed, so
  // it can never flash on screen ahead of the redirect. While `checking`,
  // App is already showing its own loader.
  return checking ? null : <PageLoader show message="Redirecting to sign in" />;
};

export default RequireAuth;
