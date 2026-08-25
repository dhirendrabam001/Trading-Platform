import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CandlestickChart,
  Eye,
  ArrowLeftRight,
  Briefcase,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  ReceiptText,
  History,
  BarChart3,
  User,
  ShieldCheck,
  Bell,
  Headphones,
  Settings,
  Database,
  TrendingUp,
  Shield,
  HelpCircle,
  X,
  Landmark,
} from "lucide-react";
import "./Sidebar.css";
import BrandLogo from "../BrandLogo/BrandLogo";

const Sidebar = ({ collapsed, mobileOpen, closeMobileSidebar }) => {
  const [openMenu, setOpenMenu] = useState(null);

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  return (
    <div
      className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}
    >
      {/* LOGO */}
      <div className="sidebar-header d-flex align-items-center justify-content-between">
        <BrandLogo alt="trade-logo" />
        <button
          className="sidebar-close-btn d-md-none"
          onClick={closeMobileSidebar}
        >
          <X size={18} />
        </button>
      </div>
      <p className="sub text-center">AI Trading Platform</p>
      <hr />

      {/* MAIN */}
      <div className="sidebar-section">
        <p className="section-title">MAIN</p>

        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            isActive ? "menu-item active" : "menu-item"
          }
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>
      </div>
      {/* MARKET */}

      <div className="sidebar-section">
        <p className="section-title">MARKET</p>
        <NavLink to="/livemarket" className="menu-item">
          <CandlestickChart size={18} />
          <span>Live Market</span>
        </NavLink>
        {/* <a href="#" className="menu-item">
          <CandlestickChart size={18} />
          <span>Live Market</span>
        </a> */}
        <NavLink to="/watchlist" className="menu-item">
          <Eye size={18} />
          <span>Watchlist</span>
        </NavLink>
      </div>

      {/* TRADING */}
      <div className="sidebar-section">
        <p className="section-title">TRADING</p>

        <NavLink to="/buysell" className="menu-item">
          <ArrowUpCircle size={18} />
          <span>Buy & Sell</span>
        </NavLink>
        <NavLink to="/open-position" className="menu-item">
          <ArrowLeftRight size={18} />
          <span>Open Position</span>
        </NavLink>
        <a href="#" className="menu-item">
          <ArrowDownCircle size={18} />
          <span>Pending Order</span>
        </a>
        <a href="#" className="menu-item">
          <History size={18} />
          <span>Orders History</span>
        </a>
      </div>

      {/* PORTFOLIO */}
      <div className="sidebar-section">
        <p className="section-title">PORTFOLIO</p>

        <a href="#" className="menu-item">
          <Database size={16} />
          <span>My Portfolio</span>
        </a>
        <a href="#" className="menu-item">
          <TrendingUp size={16} />
          <span>Holdings</span>
        </a>
        <a href="#" className="menu-item">
          <BarChart3 size={16} />
          <span>Profit & Loss</span>
        </a>
      </div>

      {/* WALLET */}
      <div className="sidebar-section">
        <p className="section-title">WALLET</p>

        <a href="#" className="menu-item">
          <Wallet size={20} />
          <span>Wallet Balance</span>
        </a>
        <a href="#" className="menu-item">
          <ArrowDownCircle size={20} />
          <span>Deposit</span>
        </a>
        <a href="#" className="menu-item">
          <ArrowUpCircle size={20} />
          <span>Withdraw</span>
        </a>
        <a href="#" className="menu-item">
          <ReceiptText size={20} />
          <span>Transactions</span>
        </a>
      </div>

      {/* REPORT */}
      <div className="sidebar-section">
        <p className="section-title">REPORTS</p>

        <a href="#" className="menu-item">
          <BarChart3 size={20} />
          <span>Trade History</span>
        </a>
        <a href="#" className="menu-item">
          <Briefcase size={20} />
          <span>Performance Report</span>
        </a>
      </div>

      {/* ACCOUNT */}
      <div className="sidebar-section">
        <p className="section-title">ACCOUNT</p>

        <a href="#" className="menu-item">
          <User size={20} />
          <span>Profile</span>
        </a>
        <a href="#" className="menu-item">
          <ShieldCheck size={20} />
          <span>KYC Verification</span>
        </a>
        <a href="#" className="menu-item">
          <Landmark size={20} />
          <span>Bank Accounts</span>
        </a>

        <a
          href="#"
          className="menu-item d-flex align-items-center justify-content-between"
        >
          <div className="d-flex align-items-center gap-2">
            <Bell size={20} />
            <span>Notifications</span>
          </div>
          <span className="badge notification-badge">5</span>
        </a>
        <a href="#" className="menu-item">
          <Shield size={20} />
          <span>Security</span>
        </a>
        <a href="#" className="menu-item">
          <Headphones size={20} />
          <span>Support</span>
        </a>

        <a href="#" className="menu-item">
          <HelpCircle size={20} />
          <span>Help Center</span>
        </a>
        <a href="#" className="menu-item">
          <Settings size={20} />
          <span>Settings</span>
        </a>
      </div>
      <hr />
      {/* USER PROFILE */}
      <div className="sidebar-user mt-auto">
        <div className="user-card">
          <div className="avatar">DB</div>
          <div className="user-info">
            <p className="name">Dhirendra Bam</p>
            <p className="email">dhirendra@gmail.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
