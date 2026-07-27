import "./App.css";
import Login from "./auth/Login/Login";
import Register from "./auth/Register/Register";
import Header from "./common/Header/Header";
import Home from "./layout/Home";
import { Route, Routes, useLocation } from "react-router-dom";

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
      </Routes>
    </>
  );
}

export default App;
