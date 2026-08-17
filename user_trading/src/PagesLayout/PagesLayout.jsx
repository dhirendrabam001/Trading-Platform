import { useEffect, useState } from "react";
import Navbar from "../common/Navbar/Navbar";
import Sidebar from "../common/Sidebar/Sidebar";
import "./PagesLayout.css";

import Footer from "../common/Footer/Footer";
import Profile from "../pages/Profile/Profile";
import LiveMarket from "../pages/LiveMarket/LiveMarket";

const PagesLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setMobileSidebarOpen((prev) => !prev);
      return;
    }
    setSidebarCollapsed((prev) => !prev);
  };

  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false);
  };

  useEffect(() => {
    if (!mobileSidebarOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileSidebarOpen]);

  // Escape closes the drawer
  useEffect(() => {
    if (!mobileSidebarOpen) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") setMobileSidebarOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileSidebarOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 768) setMobileSidebarOpen(false);
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <>
      <div
        className={`dashboard-layout d-flex ${sidebarCollapsed ? "sidebar-collapsed" : ""} ${mobileSidebarOpen ? "sidebar-open-mobile" : ""}`}
      >
        {/* SIDEBAR */}
        <Sidebar
          collapsed={sidebarCollapsed}
          mobileOpen={mobileSidebarOpen}
          closeMobileSidebar={closeMobileSidebar}
        />
        {mobileSidebarOpen && (
          <div className="sidebar-backdrop" onClick={closeMobileSidebar} />
        )}
        <div className="main-content flex-grow-1">
          {/* NAVBAR */}
          <Navbar toggleSidebar={toggleSidebar} />
          {/* DASHBOARD CARD MAIN DASHBOARD AREA */}
          <div className="dashboard-main">
            <Profile />
            <LiveMarket />
          </div>

          <Footer />
        </div>
      </div>
    </>
  );
};

export default PagesLayout;
