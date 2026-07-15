import { useState } from "react";
import {
  LayoutDashboard,
  BarChart3,
  Wallet,
  ChevronDown,
  Activity,
  Cpu,
  Layers,
  PieChart,
  Coins,
  Database,
  TrendingUp,
  Store,
  LayoutGrid,
  Settings,
  Bell,
  Shield,
  UserPlus,
  CreditCard,
  HelpCircle,
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
      className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}
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

      {/* MAIN */}
      <div className="sidebar-section">
        <p className="section-title">MAIN</p>

        <a href="#" className="menu-item active">
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </a>

        <a href="#" className="menu-item">
          <Wallet size={18} />
          <span>My Assets</span>
        </a>

        <a href="#" className="menu-item">
          <BarChart3 size={18} />
          <span>My Analytics</span>
        </a>
      </div>

      {/* TRADING & BOTS */}
      <div className="sidebar-section">
        <p className="section-title">TRADING & BOTS</p>

        <a href="#" className="menu-item">
          <Activity size={18} />
          <span>Trading</span>
        </a>

        {/* DROPDOWN */}
        <div className="dropdown-wrapper">
          <a
            href="#"
            className="menu-item"
            onClick={() => toggleMenu("control")}
          >
            <Cpu size={18} />
            <span>Control Panel</span>
            <ChevronDown
              size={16}
              className={`arrow ${openMenu === "control" ? "rotate" : ""}`}
            />
          </a>

          <div className={`submenu ${openMenu === "control" ? "show" : ""}`}>
            <a href="#">Overview</a>
            <a href="#">Bot Settings</a>
            <a href="#">Strategy</a>
          </div>
        </div>

        {/* DROPDOWN */}
        <div className="dropdown-wrapper">
          <a
            href="#"
            className="menu-item"
            onClick={(e) => {
              e.preventDefault();
              toggleMenu("aiBot");
            }}
          >
            <Cpu size={18} />
            <span>AI BOT</span>
            <ChevronDown
              size={16}
              className={`arrow ${openMenu === "aiBot" ? "rotate" : ""}`}
            />
          </a>

          <div className={`submenu ${openMenu === "aiBot" ? "show" : ""}`}>
            <a href="#">Signal Bot</a>
            <a href="#">DCA Bot</a>
            <a href="#">Arbitrage Bot</a>
            <a href="#">Pump Screener</a>
          </div>
        </div>
      </div>

      {/* DEFI */}
      <div className="sidebar-section">
        <p className="section-title">DEFI & PORTFOLIO</p>

        <a href="#" className="menu-item">
          <Database size={16} />
          <span>DeFi Center</span>
        </a>
        <a href="#" className="menu-item">
          <TrendingUp size={16} />
          <span>Yield Farming</span>
        </a>
        <a href="#" className="menu-item">
          <BarChart3 size={16} />
          <span>Liquidity Tracker</span>
        </a>
        <a href="#" className="menu-item">
          <PieChart size={16} />
          <span>Portfolio Tracker</span>
        </a>
        <a href="#" className="menu-item">
          <Wallet size={16} />
          <span>Wallets</span>
        </a>
        <a href="#" className="menu-item">
          <Layers size={16} />
          <span>DeFi Protocols</span>
        </a>
      </div>

      {/* MARKETPLACE */}
      <div className="sidebar-section">
        <p className="section-title">MARKETPLACE</p>

        <a href="#" className="menu-item">
          <Store size={20} />
          <span>Strategie Marketplace</span>
        </a>
        <a href="#" className="menu-item">
          <LayoutGrid size={20} />
          <span>Bot Templates</span>
        </a>
      </div>

      {/* ACCOUNT */}
      <div className="sidebar-section">
        <p className="section-title">ACCOUNT</p>

        <a href="#" className="menu-item">
          <Settings size={20} />
          <span>Preferences</span>
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
          <span>Security & API Keys</span>
        </a>
        <a href="#" className="menu-item">
          <UserPlus size={20} />
          <span>Invite Friends</span>
        </a>
        <a
          href="#"
          className="menu-item d-flex align-items-center justify-content-between"
        >
          <div className="d-flex align-items-center gap-2">
            <CreditCard size={20} />
            <span>Subscription</span>
          </div>
          <span className="pro-badge">PRO</span>
        </a>
        <a href="#" className="menu-item">
          <HelpCircle size={20} />
          <span>Help Center</span>
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
