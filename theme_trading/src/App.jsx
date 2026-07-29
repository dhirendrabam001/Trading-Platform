import "./App.css";
import Login from "./auth/Login/Login";
import Register from "./auth/Register/Register";
import Header from "./common/Header/Header";
import Home from "./layout/Home";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

const NO_HEADER_ROUTES = ["/login", "/register"];

function App() {
  const { pathname } = useLocation();
  const showHeader = !NO_HEADER_ROUTES.includes(pathname);

  return (
    <>
      {showHeader && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />}></Route>
        {/* Without this, an unknown path (a stale /admin/dashboard link, an
            old bookmark) renders the Header with an empty Routes outlet —
            a page that looks like "only the header". */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
