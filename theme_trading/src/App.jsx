import "./App.css";
import Login from "./auth/Login/Login";
import Register from "./auth/Register/Register";
import Header from "./common/Header/Header";
import Home from "./layout/Home";
import SmoothScroll from "./components/SmoothScroll";
import ScrollProgress from "./components/ui/ScrollProgress/ScrollProgress";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

const NO_HEADER_ROUTES = ["/login", "/register"];

function App() {
  const { pathname } = useLocation();
  const showHeader = !NO_HEADER_ROUTES.includes(pathname);

  return (
    // Lenis is mounted here rather than inside Home so the smoothed scroll
    // and the GSAP ticker survive route changes instead of being torn down
    // and rebuilt on every navigation.
    <SmoothScroll>
      {showHeader && <ScrollProgress />}
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
    </SmoothScroll>
  );
}

export default App;
