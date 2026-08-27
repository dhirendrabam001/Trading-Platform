import { useEffect, useState } from "react";
import axios from "axios";
import { USER_API_END_POINT } from "../apis/apis";

/**
 * Resolves the current session against the API.
 *
 * The session is an httpOnly cookie, so it cannot be read from JavaScript —
 * the only way to know whether someone is signed in is to ask the server.
 * withCredentials sends the cookie cross-origin; the API sets it.
 *
 * Returns { status, user } where status is "checking" until the request
 * settles, then "authed" or "guest".
 *
 * Note this deliberately fails closed: a network error or a server outage
 * resolves to "guest" rather than letting the dashboard render. Showing an
 * admin console because the auth check errored is the wrong way to fail.
 */
const useAuthSession = () => {
  const [session, setSession] = useState({ status: "checking", user: null });

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const res = await axios.get(`${USER_API_END_POINT}/getProfile`, {
          withCredentials: true,
        });

        if (cancelled) return;

        setSession(
          res.data?.success && res.data.user
            ? { status: "authed", user: res.data.user }
            : { status: "guest", user: null },
        );
      } catch {
        // 401 from authMiddleware lands here, as does any transport failure
        if (!cancelled) setSession({ status: "guest", user: null });
      }
    };

    check();

    return () => {
      cancelled = true;
    };
  }, []);

  return session;
};

export default useAuthSession;
