import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import {
  Server,
  Database,
  Cpu,
  Radio,
  HardDrive,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import "./DashboardMetrics.css";

ChartJS.register(ArcElement, ChartTooltip);

const KYC_TOTAL = "12,456";

const kycData = [
  { label: "Verified", value: "8,234", percent: 66.1, raw: 66.1, color: "#00ffb2" },
  { label: "Pending", value: "3,567", percent: 28.6, raw: 28.6, color: "#f59e0b" },
  { label: "Rejected", value: "655", percent: 5.3, raw: 5.3, color: "#ef4444" },
];

const tradingPairs = [
  {
    pair: "BTC/USDT",
    volume: "$9.87M",
    change: "2.45%",
    positive: true,
    icon: "₿",
    color: "#f7931a",
  },
  {
    pair: "ETH/USDT",
    volume: "$6.16M",
    change: "1.65%",
    positive: true,
    icon: "Ξ",
    color: "#627eea",
  },
  {
    pair: "BNB/USDT",
    volume: "$3.76M",
    change: "0.85%",
    positive: true,
    icon: "B",
    color: "#f3ba2f",
  },
  {
    pair: "SOL/USDT",
    volume: "$2.62M",
    change: "1.25%",
    positive: true,
    icon: "S",
    color: "#14f195",
  },
  {
    pair: "XRP/USDT",
    volume: "$2.13M",
    change: "0.35%",
    positive: false,
    icon: "✕",
    color: "#23292f",
  },
];

const systemServices = [
  { name: "Server Status", status: "Operational", icon: <Server size={15} /> },
  { name: "Database", status: "Operational", icon: <Database size={15} /> },
  { name: "API Services", status: "Operational", icon: <Cpu size={15} /> },
  { name: "WebSocket", status: "Operational", icon: <Radio size={15} /> },
  { name: "Backup System", status: "Operational", icon: <HardDrive size={15} /> },
];

/* Center label inside the KYC doughnut, sized off the ring so it scales with the card */
const kycCenterText = {
  id: "kycCenterText",
  beforeDraw(chart) {
    const { ctx, chartArea } = chart;
    if (!chartArea) return;

    const centerX = (chartArea.left + chartArea.right) / 2;
    const centerY = (chartArea.top + chartArea.bottom) / 2;
    const radius =
      Math.min(chartArea.right - chartArea.left, chartArea.bottom - chartArea.top) / 2;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = `700 ${Math.max(15, radius * 0.32)}px 'Space Grotesk', sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(KYC_TOTAL, centerX, centerY - radius * 0.16);

    ctx.font = `500 ${Math.max(9, radius * 0.15)}px Inter, sans-serif`;
    ctx.fillStyle = "#6b7280";
    ctx.fillText("Total Users", centerX, centerY + radius * 0.24);

    ctx.restore();
  },
};

const kycDoughnutData = {
  labels: kycData.map((d) => d.label),
  datasets: [
    {
      data: kycData.map((d) => d.raw),
      backgroundColor: kycData.map((d) => d.color),
      borderWidth: 0,
      spacing: 2,
      borderRadius: 4,
      hoverOffset: 6,
    },
  ],
};

const kycDoughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "74%",
  animation: { animateScale: true, animateRotate: true, duration: 1000 },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "rgba(9, 14, 24, 0.95)",
      borderColor: "rgba(255, 255, 255, 0.12)",
      borderWidth: 1,
      padding: 10,
      cornerRadius: 8,
      displayColors: false,
      callbacks: {
        label: (ctx) => `${ctx.label}: ${kycData[ctx.dataIndex].percent}%`,
      },
    },
  },
};

const DashboardMetrics = () => {
  return (
    <div className="row g-3 dashboard-metrics">
      {/* 1. USER KYC VERIFICATION (DONUT CHART) */}
      <div className="col-12 col-lg-4">
        <section className="dm-card">
          <header className="dm-head">
            <h5 className="dm-title">User KYC Verification</h5>
            <a href="#view-all" className="dm-link">
              View All
            </a>
          </header>

          <div className="dm-kyc-body">
            <div className="dm-donut-wrapper">
              <Doughnut
                data={kycDoughnutData}
                options={kycDoughnutOptions}
                plugins={[kycCenterText]}
              />
            </div>

            <div className="dm-kyc-legend">
              {kycData.map((item, index) => (
                <div key={item.label} className="dm-legend-item" style={{ "--i": index }}>
                  <span className="dm-legend-left">
                    <span className="dm-dot" style={{ backgroundColor: item.color }} />
                    <span className="dm-legend-label">{item.label}</span>
                  </span>
                  <span className="dm-legend-right">
                    <span className="dm-legend-val">{item.value}</span>
                    <span className="dm-legend-pct">{item.percent}%</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* 2. TOP TRADING PAIRS */}
      <div className="col-12 col-lg-4">
        <section className="dm-card">
          <header className="dm-head">
            <h5 className="dm-title">Top Trading Pairs</h5>
            <a href="#view-all" className="dm-link">
              View All
            </a>
          </header>

          <table className="dm-table">
            <thead>
              <tr>
                <th>Pair</th>
                <th>Volume</th>
                <th className="dm-right">24h</th>
              </tr>
            </thead>
            <tbody>
              {tradingPairs.map((item) => (
                <tr key={item.pair}>
                  <td>
                    <div className="dm-pair">
                      <span className="dm-pair-icon" style={{ backgroundColor: item.color }}>
                        {item.icon}
                      </span>
                      <span className="dm-pair-name">{item.pair}</span>
                    </div>
                  </td>
                  <td className="dm-volume">{item.volume}</td>
                  <td className={`dm-right dm-change ${item.positive ? "is-up" : "is-down"}`}>
                    {item.positive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                    {item.change}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      {/* 3. SYSTEM HEALTH */}
      <div className="col-12 col-lg-4">
        <section className="dm-card">
          <header className="dm-head">
            <h5 className="dm-title">System Health</h5>
            <a href="#view-all" className="dm-link">
              View All
            </a>
          </header>

          <div className="dm-health-list">
            {systemServices.map((service) => (
              <div key={service.name} className="dm-health-item">
                <span className="dm-health-left">
                  <span className="dm-service-icon">{service.icon}</span>
                  <span className="dm-service-name">{service.name}</span>
                </span>
                <span className="dm-status">
                  <span className="dm-status-dot" />
                  {service.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardMetrics;
