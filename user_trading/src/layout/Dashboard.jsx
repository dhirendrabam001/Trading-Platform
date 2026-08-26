import useSidebar from "../hooks/useSidebar";
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
  const {
    collapsed: sidebarCollapsed,
    mobileOpen: mobileSidebarOpen,
    toggleSidebar,
    closeMobileSidebar,
  } = useSidebar();

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
