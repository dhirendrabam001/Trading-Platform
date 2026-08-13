import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

// How long the loader stays up when moving between pages. The routes render
// synchronously, so there is no real event to wait on — this is the deliberate
// beat that keeps navigation from snapping.
const TRANSITION_MS = 700;

// Flags true on every route change after the first. The initial load is left
// to useGetCurrentUser, so the two never stack on a refresh.
const useRouteLoading = () => {
  const { pathname } = useLocation();
  const [loading, setLoading] = useState(false);
  const isFirstRoute = useRef(true);

  useEffect(() => {
    if (isFirstRoute.current) {
      isFirstRoute.current = false;
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => setLoading(false), TRANSITION_MS);

    return () => clearTimeout(timer);
  }, [pathname]);

  return loading;
};

export default useRouteLoading;
