import { useCallback, useEffect, useSyncExternalStore } from "react";

/* Theme store.

   Deliberately NOT a React context: the chart components need the current
   theme too, and threading a provider through every branch of the tree to
   reach them is more plumbing than this needs. An external store read via
   useSyncExternalStore gives any component the value with no provider and
   no prop drilling, and keeps a single source of truth that non-React code
   (the boot script in index.html) can also write to.

   The initial value is resolved by that boot script before first paint, so
   this module reads it back off <html> rather than deciding it again. */

export const STORAGE_KEY = "user-trading-theme";

const listeners = new Set();

const readFromDom = () =>
  document.documentElement.getAttribute("data-theme") === "light"
    ? "light"
    : "dark";

let current = typeof document === "undefined" ? "dark" : readFromDom();

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => current;

export const setTheme = (theme) => {
  const next = theme === "light" ? "light" : "dark";
  if (next === current) return;

  current = next;
  document.documentElement.setAttribute("data-theme", next);

  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Storage can be unavailable (private mode, blocked cookies). The theme
    // still applies for this session; it just will not be remembered.
  }

  listeners.forEach((listener) => listener());
};

/* Returns [theme, toggleTheme]. */
const useTheme = () => {
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => "dark");

  // Release the transition suppression once the first paint is done, so the
  // opening frame is instant but every later swap dissolves.
  useEffect(() => {
    const root = document.documentElement;
    if (!root.hasAttribute("data-theme-boot")) return;

    const frame = requestAnimationFrame(() => {
      root.removeAttribute("data-theme-boot");
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  // Follow the OS only while the user has not made a choice of their own
  useEffect(() => {
    let stored = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      stored = null;
    }
    if (stored === "light" || stored === "dark") return;

    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = (event) => {
      const next = event.matches ? "light" : "dark";
      // Apply without persisting, so the app keeps tracking the OS
      current = next;
      document.documentElement.setAttribute("data-theme", next);
      listeners.forEach((listener) => listener());
    };

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(current === "light" ? "dark" : "light");
  }, []);

  return [theme, toggleTheme];
};

export default useTheme;
