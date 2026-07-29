export const TOKEN_KEY = "token";

/**
 * Promotes the token handed over by theme_trading's post-login redirect into
 * this origin's own storage.
 *
 * localStorage is scoped per origin, so a token written by the login app on
 * :5173 is not readable here on :5174 — the query string is the handoff
 * channel. The value is removed from the URL immediately so it does not sit
 * in the address bar, the history entry, or any outgoing Referer header.
 */
export const captureSessionFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  if (!token) return;

  localStorage.setItem(TOKEN_KEY, token);

  params.delete("token");
  const query = params.toString();
  window.history.replaceState(
    {},
    "",
    window.location.pathname + (query ? `?${query}` : ""),
  );
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const clearSession = () => localStorage.removeItem(TOKEN_KEY);
