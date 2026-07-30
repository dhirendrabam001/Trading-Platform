import { Navigate, Outlet } from "react-router-dom";
const ProtectedRoute = () => {
  const token = localStorage.setItem("token");
  return token ? <Outlet /> : <Navigate to="/login" replace></Navigate>;
};

export default ProtectedRoute;
