import { useEffect, useState } from "react";
import Navbar from "../common/Navbar/Navbar";
import Sidebar from "../common/Sidebar/Sidebar";
import "./Dashboard.css";
import DashboardCard from "../components/DashboardCard/DashboardCard";
import Topbar from "../components/Topbar/Topbar";
import PortfolioPerformance from "../components/PortfolioPerformance/PortfolioPerformance";
import OverviewSection from "../components/OverviewSection/OverviewSection";
import CryptoDashboard from "../components/CryptoDashboard/CryptoDashboard";
import Footer from "../common/Footer/Footer";

const Dashboard = () => {
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

  // Hold the page still while the drawer is open, so scrolling the menu does
  // not run the dashboard underneath it
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

  // Widening past the breakpoint turns the sidebar back into a fixed rail;
  // without this the backdrop would linger over the desktop layout
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
            <Topbar />
            <DashboardCard />
            <PortfolioPerformance />
            <OverviewSection />
            <CryptoDashboard />
          </div>

          <Footer />
        </div>
      </div>
    </>
  );
};

export default Dashboard;
