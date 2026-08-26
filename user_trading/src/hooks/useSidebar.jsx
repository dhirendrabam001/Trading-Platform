import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

// Below this width the sidebar stops being a rail and becomes an off-canvas
// drawer. Kept here so the layouts and the CSS breakpoint cannot drift apart.
const MOBILE_BREAKPOINT = 768;

// Owns every piece of sidebar state: the desktop collapse, the mobile drawer,
// the body scroll lock, Escape-to-close, and the reset on navigation.
//
// Dashboard and PagesLayout each carried their own copy of this, which is how
// they ended up behaving differently — only one of them can be fixed at a time
// when the logic lives in two places.
const useSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();

  const toggleSidebar = useCallback(() => {
    if (window.innerWidth <= MOBILE_BREAKPOINT) {
      setMobileOpen((prev) => !prev);
      return;
    }
    setCollapsed((prev) => !prev);
  }, []);

  const closeMobileSidebar = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Hold the page still while the drawer is open, so scrolling the menu does
  // not run the content underneath it
  useEffect(() => {
    if (!mobileOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  // Escape closes the drawer
  useEffect(() => {
    if (!mobileOpen) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  // Widening past the breakpoint turns the sidebar back into a fixed rail;
  // without this the backdrop would linger over the desktop layout
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > MOBILE_BREAKPOINT) setMobileOpen(false);
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return { collapsed, mobileOpen, toggleSidebar, closeMobileSidebar };
};

export default useSidebar;
