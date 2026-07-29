import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import "./CryptoDashboard.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
);

// Brand colours read as a trading UI in a way Bootstrap's bg-warning/bg-info
// utilities do not
const topGainers = [
  { symbol: "DOGE / USDT", mark: "D", color: "#c2a633", price: "$0.1234", change: "12.45%" },
  { symbol: "LINK / USDT", mark: "L", color: "#2a5ada", price: "$16.25", change: "8.32%" },
  { symbol: "ADA / USDT", mark: "A", color: "#0033ad", price: "$0.4567", change: "6.78%" },
];

const topLosers = [
  { symbol: "UNI / USDT", mark: "U", color: "#ff007a", price: "$7.25", change: "5.25%" },
  { symbol: "MATIC / USDT", mark: "M", color: "#8247e5", price: "$0.6234", change: "3.45%" },
  { symbol: "LTC / USDT", mark: "L", color: "#7a7f83", price: "$85.12", change: "2.98%" },
];

const verifications = ["KYC", "2FA", "Email", "Phone"];

const HEALTH_SCORE = 85;

const MarketTable = ({ rows, isGain }) => (
  <table className="cd-table">
    <thead>
      <tr>
        <th>Asset</th>
        <th>Price</th>
        <th>24h</th>
      </tr>
    </thead>
    <tbody>
      {rows.map((row) => (
        <tr key={row.symbol}>
          <td>
            <div className="cd-asset">
              <span className="cd-token" style={{ backgroundColor: row.color }}>
                {row.mark}
              </span>
              <span className="cd-asset-name">{row.symbol}</span>
            </div>
          </td>
          <td className="cd-price">{row.price}</td>
          <td>
            <span className={`cd-badge ${isGain ? "is-gain" : "is-loss"}`}>
              {isGain ? "▲" : "▼"} {row.change}
            </span>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const CryptoDashboard = () => {
  // P&L bars — green above the mean, red below
  const pnlValues = [12, 18, 8, 10, 14, 11, 9, 6, 7, 15];
  const pnlChartData = {
    labels: pnlValues.map((_, i) => i.toString()),
    datasets: [
      {
        data: pnlValues,
        backgroundColor: pnlValues.map((v) => (v > 10 ? "#00ffb2" : "#ef4444")),
        borderRadius: 3,
        borderSkipped: false,
        barPercentage: 0.55,
        categoryPercentage: 0.9,
      },
    ],
  };

  const pnlChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: { x: { display: false }, y: { display: false, beginAtZero: true } },
  };

  // Semi-circle gauge: value arc over a muted track, so 85 is actually shown
  // rather than decorated with a fixed four-colour band
  const gaugeChartData = {
    datasets: [
      {
        data: [HEALTH_SCORE, 100 - HEALTH_SCORE],
        backgroundColor: ["#00ffb2", "rgba(255,255,255,0.07)"],
        borderWidth: 0,
        circumference: 180,
        rotation: 270,
      },
    ],
  };

  const gaugeChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "78%",
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
  };

  return (
    <section className="cd-section">
      <div className="cd-grid">
        {/* ---------- Top Gainers ---------- */}
        <div className="cd-card">
          <div className="cd-card-header">
            <span className="cd-card-title">
              <TrendingUp size={16} className="cd-ico-gain" />
              Top Gainers
            </span>
            <button type="button" className="cd-view-all">
              View All
            </button>
          </div>
          <MarketTable rows={topGainers} isGain />
        </div>

        {/* ---------- Top Losers ---------- */}
        <div className="cd-card">
          <div className="cd-card-header">
            <span className="cd-card-title">
              <TrendingDown size={16} className="cd-ico-loss" />
              Top Losers
            </span>
            <button type="button" className="cd-view-all">
              View All
            </button>
          </div>
          <MarketTable rows={topLosers} isGain={false} />
        </div>

        {/* ---------- P&L Overview ---------- */}
        <div className="cd-card">
          <div className="cd-card-header">
            <span className="cd-card-title">P&amp;L Overview</span>
            <button type="button" className="cd-view-all">
              View Report
            </button>
          </div>

          <div className="cd-pnl-row">
            <div className="cd-stat">
              <span className="cd-stat-label">Total Profit</span>
              <span className="cd-stat-value is-gain">$24,562.34</span>
            </div>
            <div className="cd-stat is-right">
              <span className="cd-stat-label">Total Loss</span>
              <span className="cd-stat-value is-loss">$12,105.23</span>
            </div>
          </div>

          <div className="cd-chart">
            <Bar data={pnlChartData} options={pnlChartOptions} />
          </div>
        </div>

        {/* ---------- Account Health ---------- */}
        <div className="cd-card">
          <div className="cd-card-header">
            <span className="cd-card-title">
              <ShieldCheck size={16} className="cd-ico-gain" />
              Account Health
            </span>
          </div>

          <div className="cd-health">
            <div className="cd-gauge">
              <Doughnut data={gaugeChartData} options={gaugeChartOptions} />
              <div className="cd-gauge-overlay">
                <span className="cd-gauge-score">{HEALTH_SCORE}</span>
                <span className="cd-gauge-label">Excellent</span>
              </div>
            </div>

            <ul className="cd-verify">
              {verifications.map((item) => (
                <li key={item}>
                  <CheckCircle2 size={13} className="cd-ico-gain" />
                  <span className="cd-verify-name">{item}</span>
                  <span className="cd-verify-tick">✓</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CryptoDashboard;
