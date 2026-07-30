import React, { useState } from "react";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  UserCheck,
  FileText,
  LineChart,
  ArrowRightLeft,
  Coins,
  FolderTree,
  ArrowDownCircle,
  ArrowUpCircle,
  Receipt,
  Percent,
  ListOrdered,
  Layers,
  History,
  Megaphone,
  LifeBuoy,
  BarChart,
  Settings,
  Shield,
  Key,
  Puzzle,
  ChevronDown,
  X,
} from "lucide-react";
import "./Sidebar.css";
import Logo from "/Images/trade-logo.png";

const Sidebar = ({ collapsed, mobileOpen, closeMobileSidebar }) => {
  const [openMenu, setOpenMenu] = useState(null);

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  return (
    <div
      className={`sidebar ${collapsed ? "collapsed" : ""} ${
        mobileOpen ? "mobile-open" : ""
      }`}
    >
      {/* LOGO */}
      <div className="sidebar-header d-flex align-items-center justify-content-between">
        <img src={Logo} alt="trade-logo" />
        <button
          className="sidebar-close-btn d-md-none"
          onClick={closeMobileSidebar}
        >
          <X size={18} />
        </button>
      </div>
      <p className="sub text-center">AI Trading Platform</p>
      <hr />

      {/* DASHBOARD */}
      <div className="sidebar-section">
        <a href="#" className="menu-item active">
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </a>
      </div>

      {/* USER MANAGEMENT */}
      <div className="sidebar-section">
        <p className="section-title">USER MANAGEMENT</p>

        <a href="#" className="menu-item">
          <Users size={18} />
          <span>Users</span>
        </a>
        <a href="#" className="menu-item">
          <ShieldCheck size={18} />
          <span>KYC Verification</span>
        </a>
        <a href="#" className="menu-item">
          <UserCheck size={18} />
          <span>Roles & Permissions</span>
        </a>
        <a href="#" className="menu-item">
          <FileText size={18} />
          <span>Activity Logs</span>
        </a>
      </div>

      {/* MARKET MANAGEMENT */}
      <div className="sidebar-section">
        <p className="section-title">MARKET MANAGEMENT</p>

        <a href="#" className="menu-item">
          <LineChart size={18} />
          <span>Markets</span>
        </a>
        <a href="#" className="menu-item">
          <ArrowRightLeft size={18} />
          <span>Trading Pairs</span>
        </a>
        <a href="#" className="menu-item">
          <Coins size={18} />
          <span>Assets</span>
        </a>
        <a href="#" className="menu-item">
          <FolderTree size={18} />
          <span>Categories</span>
        </a>
      </div>

      {/* FINANCIAL MANAGEMENT */}
      <div className="sidebar-section">
        <p className="section-title">FINANCIAL MANAGEMENT</p>

        <a href="#" className="menu-item">
          <ArrowDownCircle size={18} />
          <span>Deposits</span>
        </a>
        <a href="#" className="menu-item">
          <ArrowUpCircle size={18} />
          <span>Withdrawals</span>
        </a>
        <a href="#" className="menu-item">
          <Receipt size={18} />
          <span>Transactions</span>
        </a>
        <a href="#" className="menu-item">
          <Percent size={18} />
          <span>Fees & Charges</span>
        </a>
      </div>

      {/* TRADING MANAGEMENT */}
      <div className="sidebar-section">
        <p className="section-title">TRADING MANAGEMENT</p>

        <a href="#" className="menu-item">
          <ListOrdered size={18} />
          <span>Orders</span>
        </a>
        <a href="#" className="menu-item">
          <Layers size={18} />
          <span>Open Positions</span>
        </a>
        <a href="#" className="menu-item">
          <ArrowRightLeft size={18} />
          <span>Trades</span>
        </a>
        <a href="#" className="menu-item">
          <History size={18} />
          <span>Order History</span>
        </a>
      </div>

      {/* PLATFORM MANAGEMENT */}
      <div className="sidebar-section">
        <p className="section-title">PLATFORM MANAGEMENT</p>

        <a href="#" className="menu-item">
          <Megaphone size={18} />
          <span>Announcements</span>
        </a>
        <a href="#" className="menu-item">
          <LifeBuoy size={18} />
          <span>Support Tickets</span>
        </a>
        <a href="#" className="menu-item">
          <BarChart size={18} />
          <span>Reports</span>
        </a>
      </div>

      {/* SYSTEM SETTINGS */}
      <div className="sidebar-section">
        <p className="section-title">SYSTEM SETTINGS</p>

        <a href="#" className="menu-item">
          <Settings size={18} />
          <span>System Settings</span>
        </a>
        <a href="#" className="menu-item">
          <Shield size={18} />
          <span>Security</span>
        </a>
        <a href="#" className="menu-item">
          <Key size={18} />
          <span>API Management</span>
        </a>
        <a href="#" className="menu-item">
          <Puzzle size={18} />
          <span>Integrations</span>
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
