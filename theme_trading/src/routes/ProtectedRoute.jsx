import { Navigate, Outlet } from "react-router-dom";

/**
 * Keeps a signed-in visitor out of /login and /register.
 *
 * The previous version read the session with localStorage.setItem("token") —
 * a setter, which returns undefined *and* writes the string "undefined" into
 * storage. It therefore always redirected, and corrupted the key it was
 * trying to read. It was never mounted, which is the only reason that never
 * caused damage.
 *
 * The real session is an httpOnly cookie that JavaScript cannot read, so a
 * definitive answer requires asking the API. This guard is intentionally the
 * cheap client-side hint only: it is about not showing a login form to
 * someone already signed in. Actual protection is the API's authMiddleware.
 */
const ProtectedRoute = ({ isAuthenticated, redirectTo = "/" }) =>
  isAuthenticated ? <Navigate to={redirectTo} replace /> : <Outlet />;

export default ProtectedRoute;
