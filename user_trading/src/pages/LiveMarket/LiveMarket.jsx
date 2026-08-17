import React, { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import {
  Search,
  Bell,
  Sun,
  Star,
  ChevronDown,
  Plus,
  Minus,
  LayoutDashboard,
  TrendingUp,
  Bookmark,
  ShoppingBag,
  Clock,
  History,
  Briefcase,
  Wallet,
  ShieldCheck,
  Settings,
  HelpCircle,
  UserCheck,
  Maximize2,
  Sliders,
  Compass,
} from "lucide-react";
import "./LiveMarket.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const LiveMarket = () => {
  const [orderType, setOrderType] = useState("Buy");
  const [tabType, setTabType] = useState("Limit");
  const [timeframe, setTimeframe] = useState("5m");

  // Chart Mock Data
  const labels = ["06:00", "09:00", "12:00", "15:00", "18:00", "21:00"];

  const chartData = {
    labels,
    datasets: [
      {
        type: "line",
        label: "BTC Price",
        data: [65400, 66200, 67800, 67100, 68000, 67245.8],
        borderColor: "#00ffb2",
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: true,
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, "rgba(0, 255, 178, 0.25)");
          gradient.addColorStop(1, "rgba(0, 255, 178, 0.0)");
          return gradient;
        },
        yAxisID: "y",
      },
      {
        type: "bar",
        label: "Volume",
        data: [1200, 1900, 3000, 2100, 2800, 2450],
        backgroundColor: "rgba(0, 255, 178, 0.2)",
        borderRadius: 2,
        yAxisID: "y1",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(10, 16, 28, 0.9)",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        titleColor: "#ffffff",
        bodyColor: "#a1a1aa",
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(255, 255, 255, 0.03)" },
        ticks: { color: "#6b7280" },
      },
      y: {
        type: "linear",
        position: "right",
        grid: { color: "rgba(255, 255, 255, 0.03)" },
        ticks: { color: "#6b7280" },
      },
      y1: {
        type: "linear",
        position: "left",
        display: false,
        max: 10000,
      },
    },
  };

  return (
    <div className="market-layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">N</div>
          <div>
            <h2>nexa</h2>
            <span>AI Trading Platform</span>
          </div>
        </div>

        <nav className="sidebar-menu">
          <div className="menu-group">
            <span className="group-title">MAIN</span>
            <a href="#" className="nav-item">
              <LayoutDashboard size={18} /> Dashboard
            </a>
          </div>

          <div className="menu-group">
            <span className="group-title">MARKET</span>
            <a href="#" className="nav-item active">
              <TrendingUp size={18} /> Live Market
            </a>
            <a href="#" className="nav-item">
              <Bookmark size={18} /> Watchlist
            </a>
          </div>

          <div className="menu-group">
            <span className="group-title">TRADING</span>
            <a href="#" className="nav-item">
              <ShoppingBag size={18} /> Buy & Sell
            </a>
            <a href="#" className="nav-item">
              <Clock size={18} /> Open Orders
            </a>
            <a href="#" className="nav-item">
              <History size={18} /> Order History
            </a>
          </div>

          <div className="menu-group">
            <span className="group-title">PORTFOLIO</span>
            <a href="#" className="nav-item">
              <Briefcase size={18} /> My Portfolio
            </a>
            <a href="#" className="nav-item">
              <Wallet size={18} /> Wallet Balance
            </a>
          </div>

          <div className="menu-group">
            <span className="group-title">ACCOUNT</span>
            <a href="#" className="nav-item">
              <UserCheck size={18} /> Profile
            </a>
            <a href="#" className="nav-item">
              <ShieldCheck size={18} /> Security
            </a>
            <a href="#" className="nav-item">
              <Settings size={18} /> Settings
            </a>
          </div>
        </nav>

        <div className="sidebar-help">
          <HelpCircle size={20} />
          <div>
            <strong>Need Help?</strong>
            <p>Help Center</p>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="market-main">
        {/* TOP NAVBAR */}
        <header className="topbar">
          <div className="search-bar">
            <Search size={16} />
            <input type="text" placeholder="Search coins, pairs, markets..." />
          </div>

          <div className="topbar-actions">
            <button className="icon-btn">
              <Sun size={18} />
            </button>
            <button className="icon-btn notification-btn">
              <Bell size={18} />
              <span className="badge">0</span>
            </button>
            <div className="user-profile">
              <div className="avatar">DT</div>
              <ChevronDown size={14} />
            </div>
          </div>
        </header>

        {/* TOP BAR TICKER INFO */}
        <div className="ticker-bar card">
          <div className="ticker-pair">
            <div className="coin-icon">₿</div>
            <div>
              <h3>
                BTC / USDT <ChevronDown size={14} />
              </h3>
              <p>Bitcoin</p>
            </div>
          </div>

          <div className="ticker-price">
            <span className="price">$67,245.80</span>
            <span className="change positive">+1,605.32 (+2.45%)</span>
          </div>

          <div className="ticker-stats">
            <div>
              <span className="text-muted">24h High</span>
              <strong>67,890.25</strong>
            </div>
            <div>
              <span className="text-muted">24h Low</span>
              <strong>65,432.10</strong>
            </div>
            <div>
              <span className="text-muted">24h Volume (BTC)</span>
              <strong>24,562.34</strong>
            </div>
            <div>
              <span className="text-muted">24h Change</span>
              <strong className="text-success">+2.45%</strong>
            </div>
          </div>

          <button className="btn-watchlist">
            <Star size={14} /> Add to Watchlist
          </button>
        </div>

        {/* MAIN DASHBOARD CONTENT GRID */}
        <div className="dashboard-grid">
          {/* LEFT CONTENT COLUMN */}
          <div className="left-column">
            {/* CHART CONTAINER */}
            <div className="chart-card card">
              <div className="chart-header">
                <div className="chart-tabs">
                  <button className="tab active">Chart</button>
                  <button className="tab">Market Depth</button>
                  <button className="tab">Trade History</button>
                </div>

                <div className="chart-controls">
                  <div className="timeframe-selector">
                    {["1m", "5m", "15m", "1H", "4H", "1D"].map((tf) => (
                      <button
                        key={tf}
                        className={timeframe === tf ? "active" : ""}
                        onClick={() => setTimeframe(tf)}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                  <button className="icon-btn">
                    <Maximize2 size={16} />
                  </button>
                </div>
              </div>

              <div className="chart-body">
                <Line data={chartData} options={chartOptions} />
              </div>

              <div className="chart-footer">
                <div className="time-quick-select">
                  {["1D", "5D", "1M", "3M", "6M", "1Y", "All"].map((t) => (
                    <button key={t}>{t}</button>
                  ))}
                </div>
                <div className="utc-time">18:45:32 (UTC+5:30)</div>
              </div>
            </div>

            {/* THREE PANELS (Market Overview, Recent Trades, Market Info) */}
            <div className="info-panels-grid">
              {/* Market Overview */}
              <div className="info-card card">
                <h4>Market Overview</h4>
                <ul className="list-data">
                  <li>
                    <span>
                      <strong className="coin-dot btc">₿</strong> BTC / USDT
                    </span>
                    <span>
                      67,245.80 <small className="text-success">+2.45%</small>
                    </span>
                  </li>
                  <li>
                    <span>
                      <strong className="coin-dot eth">Ξ</strong> ETH / USDT
                    </span>
                    <span>
                      3,512.75 <small className="text-success">+1.65%</small>
                    </span>
                  </li>
                  <li>
                    <span>
                      <strong className="coin-dot bnb">B</strong> BNB / USDT
                    </span>
                    <span>
                      602.45 <small className="text-success">+0.85%</small>
                    </span>
                  </li>
                  <li>
                    <span>
                      <strong className="coin-dot sol">S</strong> SOL / USDT
                    </span>
                    <span>
                      142.35 <small className="text-success">+1.25%</small>
                    </span>
                  </li>
                  <li>
                    <span>
                      <strong className="coin-dot xrp">X</strong> XRP / USDT
                    </span>
                    <span>
                      0.5987 <small className="text-danger">-0.35%</small>
                    </span>
                  </li>
                </ul>
              </div>

              {/* Recent Trades */}
              <div className="info-card card">
                <h4>Recent Trades</h4>
                <div className="table-mini">
                  <div className="thead">
                    <span>Price (USDT)</span>
                    <span>Amount</span>
                    <span>Time</span>
                  </div>
                  <div className="tbody">
                    <div className="trow text-success">
                      <span>67,245.80</span>
                      <span>0.0456</span>
                      <span>18:45:32</span>
                    </div>
                    <div className="trow text-danger">
                      <span>67,245.10</span>
                      <span>0.1250</span>
                      <span>18:45:31</span>
                    </div>
                    <div className="trow text-danger">
                      <span>67,244.70</span>
                      <span>0.0852</span>
                      <span>18:45:30</span>
                    </div>
                    <div className="trow text-success">
                      <span>67,244.30</span>
                      <span>0.1556</span>
                      <span>18:45:29</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Market Info */}
              <div className="info-card card">
                <h4>Market Info</h4>
                <div className="info-rows">
                  <div>
                    <span>Rank</span>
                    <strong>#1</strong>
                  </div>
                  <div>
                    <span>Market Cap</span>
                    <strong>$1.32T</strong>
                  </div>
                  <div>
                    <span>Circulating Supply</span>
                    <strong>19.69M BTC</strong>
                  </div>
                  <div>
                    <span>FDV</span>
                    <strong>$1.41T</strong>
                  </div>
                  <div>
                    <span>All Time High</span>
                    <strong>$73,750.07</strong>
                  </div>
                  <div>
                    <span>All Time Low</span>
                    <strong>$67.81</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* OPEN ORDERS */}
            <div className="orders-card card">
              <div className="orders-header">
                <button className="tab active">Open Orders (3)</button>
                <button className="tab">Order History</button>
              </div>

              <div className="responsive-table">
                <table>
                  <thead>
                    <tr>
                      <th>Pair</th>
                      <th>Type</th>
                      <th>Side</th>
                      <th>Price (USDT)</th>
                      <th>Amount</th>
                      <th>Filled</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>₿ BTC / USDT</td>
                      <td>Limit</td>
                      <td className="text-success">Buy</td>
                      <td>67,200.00</td>
                      <td>0.1250</td>
                      <td>0.0000</td>
                      <td>8,400.00</td>
                      <td>
                        <span className="badge-open">Open</span>
                      </td>
                      <td>
                        <button className="btn-cancel">Cancel</button>
                      </td>
                    </tr>
                    <tr>
                      <td>Ξ ETH / USDT</td>
                      <td>Limit</td>
                      <td className="text-danger">Sell</td>
                      <td>3,550.00</td>
                      <td>1.2500</td>
                      <td>0.0000</td>
                      <td>4,437.50</td>
                      <td>
                        <span className="badge-open">Open</span>
                      </td>
                      <td>
                        <button className="btn-cancel">Cancel</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT CONTENT COLUMN */}
          <div className="right-column">
            {/* ORDER BOOK */}
            <div className="order-book card">
              <div className="order-book-header">
                <h4>Order Book</h4>
                <select className="select-precision">
                  <option>0.01</option>
                  <option>0.1</option>
                </select>
              </div>

              <div className="ob-table-head">
                <span>Price (USDT)</span>
                <span>Amount (BTC)</span>
                <span>Total</span>
              </div>

              {/* Asks / Red */}
              <div className="ob-list asks">
                <div className="ob-row">
                  <span className="text-danger">67,249.50</span>
                  <span>0.1250</span>
                  <span>8,405.56</span>
                </div>
                <div className="ob-row">
                  <span className="text-danger">67,249.10</span>
                  <span>0.0852</span>
                  <span>5,723.65</span>
                </div>
                <div className="ob-row">
                  <span className="text-danger">67,248.70</span>
                  <span>0.1556</span>
                  <span>10,462.81</span>
                </div>
              </div>

              {/* Mid Current Price */}
              <div className="ob-mid-price">
                <span className="text-success price-large">
                  67,245.80 ▲ 2.45%
                </span>
              </div>

              {/* Bids / Green */}
              <div className="ob-list bids">
                <div className="ob-row">
                  <span className="text-success">67,245.50</span>
                  <span>0.1523</span>
                  <span>10,241.21</span>
                </div>
                <div className="ob-row">
                  <span className="text-success">67,245.10</span>
                  <span>0.0856</span>
                  <span>5,749.59</span>
                </div>
                <div className="ob-row">
                  <span className="text-success">67,244.70</span>
                  <span>0.1256</span>
                  <span>8,449.97</span>
                </div>
              </div>

              {/* Buy / Sell Depth Ratio Bar */}
              <div className="depth-ratio">
                <div className="bar-buy" style={{ width: "58%" }}>
                  B 58%
                </div>
                <div className="bar-sell" style={{ width: "42%" }}>
                  42% S
                </div>
              </div>
            </div>

            {/* ORDER EXECUTION FORM */}
            <div className="trade-form card">
              <div className="trade-type-tabs">
                <button
                  className={`tab-btn buy ${orderType === "Buy" ? "active" : ""}`}
                  onClick={() => setOrderType("Buy")}
                >
                  Buy
                </button>
                <button
                  className={`tab-btn sell ${orderType === "Sell" ? "active" : ""}`}
                  onClick={() => setOrderType("Sell")}
                >
                  Sell
                </button>
              </div>

              <div className="execution-tabs">
                {["Limit", "Market", "Stop Limit"].map((type) => (
                  <button
                    key={type}
                    className={tabType === type ? "active" : ""}
                    onClick={() => setTabType(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="form-inputs">
                <div className="input-field">
                  <label>Price (USDT)</label>
                  <div className="input-wrap">
                    <input type="text" defaultValue="67245.80" />
                    <button>
                      <Minus size={14} />
                    </button>
                    <button>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div className="input-field">
                  <label>Amount (BTC)</label>
                  <div className="input-wrap">
                    <input type="text" placeholder="0.00" />
                    <button>
                      <Minus size={14} />
                    </button>
                    <button>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Percentage Slider Step Buttons */}
                <div className="percentage-stepper">
                  {["0%", "25%", "50%", "75%", "100%"].map((pct) => (
                    <button key={pct}>{pct}</button>
                  ))}
                </div>

                <div className="input-field">
                  <label>Total (USDT)</label>
                  <div className="input-wrap">
                    <input type="text" placeholder="0.00" />
                  </div>
                </div>

                <div className="balance-info">
                  <span>Available Balance</span>
                  <strong>24,562.34 USDT</strong>
                </div>

                <button className={`btn-submit ${orderType.toLowerCase()}`}>
                  {orderType} BTC
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LiveMarket;
