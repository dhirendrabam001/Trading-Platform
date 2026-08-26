import useSidebar from "../hooks/useSidebar";
import Navbar from "../common/Navbar/Navbar";
import Sidebar from "../common/Sidebar/Sidebar";
import "./PagesLayout.css";

import Footer from "../common/Footer/Footer";
import Profile from "../pages/Profile/Profile";
import LiveMarket from "../pages/LiveMarket/LiveMarket";
import Watchlist from "../pages/Watchlist/Watchlist";
import BuySell from "../pages/BuySell/BuySell";
import OpenPosition from "../pages/OpenPosition/OpenPosition";
import PendingOrder from "../pages/PendingOrder/PendingOrder";
import Orders from "../pages/Orders/Orders";
import Portfolio from "../pages/Portfolio/Portfolio";
import ProfitLoss from "../pages/ProfitLoss/ProfitLoss";
import Wallet from "../pages/Wallet/Wallet";
import Deposit from "../pages/Deposit/Deposit";
import Withdraw from "../pages/Withdraw/Withdraw";
import Transactions from "../pages/Transactions/Transactions";
import TradeHistory from "../pages/TradeHistory/TradeHistory";
import PerformanceReport from "../pages/PerformanceReport/PerformanceReport";
import KYC from "../pages/KYC/KYC";
import BankAccount from "../pages/BankAccount/BankAccount";
import Notifications from "../pages/Notifications/Notifications";
import Security from "../pages/Security/Security";
import Support from "../pages/Support/Support";
import Help from "../pages/Help/Help";

const PagesLayout = ({ page }) => {
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
            {page === "profile" && <Profile />}
            {page === "livemarket" && <LiveMarket />}
            {page === "watchlist" && <Watchlist />}
            {page === "buysell" && <BuySell />}
            {page === "open-position" && <OpenPosition />}
            {page === "pending-order" && <PendingOrder />}
            {page === "orders" && <Orders />}
            {page === "portfolio" && <Portfolio />}
            {page === "profit-loss" && <ProfitLoss />}
            {page === "wallet" && <Wallet />}
            {page === "deposit" && <Deposit />}
            {page === "withdraw" && <Withdraw />}
            {page === "transactions" && <Transactions />}
            {page === "trade-history" && <TradeHistory />}
            {page === "performance" && <PerformanceReport />}
            {page === "kyc" && <KYC />}
            {page === "bank-accounts" && <BankAccount />}
            {page === "notifications" && <Notifications />}
            {page === "security" && <Security />}
            {page === "support" && <Support />}
            {page === "help" && <Help />}
          </div>
          <Footer />
        </div>
      </div>
    </>
  );
};

export default PagesLayout;
