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
  ChevronRight,
} from "lucide-react";
import "./Sidebar.css";
import BrandLogo from "../BrandLogo/BrandLogo";
import useCurrentUser from "../../hooks/useCurrentUser";

const Sidebar = ({ collapsed, mobileOpen, closeMobileSidebar }) => {
  const [openMenu, setOpenMenu] = useState(null);

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const { email, fullName, initials } = useCurrentUser();

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
        <NavLink to="/pending-order" className="menu-item">
          <ArrowDownCircle size={18} />
          <span>Pending Order</span>
        </NavLink>
        <NavLink to="/orders" className="menu-item">
          <History size={18} />
          <span>Orders History</span>
        </NavLink>
      </div>

      {/* PORTFOLIO */}
      <div className="sidebar-section">
        <p className="section-title">PORTFOLIO</p>

        <NavLink to="/portfolio" className="menu-item">
          <Database size={16} />
          <span>My Portfolio</span>
        </NavLink>

        <a href="#" className="menu-item">
          <TrendingUp size={16} />
          <span>Holdings</span>
        </a>
        <NavLink to="/profit-loss" className="menu-item">
          <BarChart3 size={16} />
          <span>Profit & Loss</span>
        </NavLink>
      </div>

      {/* WALLET */}
      <div className="sidebar-section">
        <p className="section-title">WALLET</p>

        <NavLink to="/wallet" className="menu-item">
          <Wallet size={20} />
          <span>Wallet Balance</span>
        </NavLink>
        <NavLink to="/deposit" className="menu-item">
          <ArrowDownCircle size={20} />
          <span>Deposit</span>
        </NavLink>
        <NavLink to="/withdraw" className="menu-item">
          <ArrowUpCircle size={20} />
          <span>Withdraw</span>
        </NavLink>
        <NavLink to="/transactions" className="menu-item">
          <ReceiptText size={20} />
          <span>Transactions</span>
        </NavLink>
      </div>

      {/* REPORT */}
      <div className="sidebar-section">
        <p className="section-title">REPORTS</p>

        <NavLink to="/trade-history" className="menu-item">
          <BarChart3 size={20} />
          <span>Trade History</span>
        </NavLink>
        <NavLink to="/performance" className="menu-item">
          <Briefcase size={20} />
          <span>Performance Report</span>
        </NavLink>
      </div>

      {/* ACCOUNT */}
      <div className="sidebar-section">
        <p className="section-title">ACCOUNT</p>

        <NavLink to="/profile" className="menu-item">
          <User size={20} />
          <span>Profile</span>
        </NavLink>
        <NavLink to="/kyc" className="menu-item">
          <ShieldCheck size={20} />
          <span>KYC Verification</span>
        </NavLink>
        <NavLink to="/bank-accounts" className="menu-item">
          <Landmark size={20} />
          <span>Bank Accounts</span>
        </NavLink>

        <NavLink
          to="/notifications"
          className="menu-item d-flex align-items-center justify-content-between"
        >
          <div className="d-flex align-items-center gap-2">
            <Bell size={20} />
            <span>Notifications</span>
          </div>
          <span className="badge notification-badge">5</span>
        </NavLink>
        <NavLink to="/security" className="menu-item">
          <Shield size={20} />
          <span>Security</span>
        </NavLink>
        <NavLink to="/support" className="menu-item">
          <Headphones size={20} />
          <span>Support</span>
        </NavLink>

        <NavLink to="/help" className="menu-item">
          <HelpCircle size={20} />
          <span>Help Center</span>
        </NavLink>
        <a href="#" className="menu-item">
          <Settings size={20} />
          <span>Settings</span>
        </a>
      </div>
      <hr />
      {/* USER PROFILE */}
      <div className="sidebar-user mt-auto">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            isActive ? "user-card active" : "user-card"
          }
          title={email ? `${fullName} — ${email}` : fullName}
        >
          <span className="avatar">
            {initials}
            <i className="avatar-status" aria-hidden="true" />
          </span>
          <span className="user-info">
            <span className="name">{fullName}</span>
            <span className="email">{email}</span>
          </span>
          <ChevronRight size={16} className="user-chevron" aria-hidden="true" />
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
