import { useState } from "react";
import Navbar from "../common/Navbar/Navbar";
import Sidebar from "../common/Sidebar/Sidebar";
import "./Dashboard.css";
import DashboardCard from "../components/DashboardCard/DashboardCard";

import Topbar from "../components/Topbar/Topbar";
import TradingOverview from "../components/TradingOverview/TradingOverview";
import RecentActivity from "../components/RecentActivity/RecentActivity";
import DashboardMetrics from "../components/DashboardMetrics/DashboardMetrics";
import ActivityLogs from "../components/ActivityLogs/ActivityLogs";
import SecondaryStats from "../components/SecondaryStats/SecondaryStats";

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
            <TradingOverview />
            <RecentActivity />
            <DashboardMetrics />
            <ActivityLogs />
            <SecondaryStats />
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
