import { useState } from "react";
import "./PortfolioPerformance.css";
import useChartTheme from "../../utils/chartTheme";
import { Info } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
);

const timeframeData = {
  "1D": {
    labels: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "24:00"],
    data: [830, 835, 832, 840, 838, 845, 847.23],
  },
  "1W": {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    data: [810, 818, 825, 820, 835, 840, 847.23],
  },
  "1M": {
    labels: [
      "May 24",
      "May 31",
      "Jun 07",
      "Jun 14",
      "Jun 21",
      "Jun 28",
      "Jul 05",
      "Jul 12",
      "Jul 19",
    ],
    data: [700, 720, 712, 740, 770, 760, 810, 835, 795, 820, 810, 840, 830, 870, 860, 910, 890, 925],
    xLabels: ["May 24", "May 31", "Jun 07", "Jun 14", "Jun 21", "Jun 28", "Jul 05", "Jul 12", "Jul 19"],
  },
  "3M": {
    labels: ["May", "Jun", "Jul"],
    data: [650, 720, 847.23],
  },
  "1Y": {
    labels: ["Q1", "Q2", "Q3", "Q4"],
    data: [520, 640, 750, 847.23],
  },
  ALL: {
    labels: ["2022", "2023", "2024", "2025", "2026"],
    data: [300, 450, 620, 780, 847.23],
  },
};

const marketWatchItems = [
  {
    symbol: "BTC / USDT",
    name: "Bitcoin",
    price: "$67,245.80",
    change: "+ 2.45%",
    isUp: true,
    iconBg: "#f7931a",
    iconText: "₿",
  },
  {
    symbol: "ETH / USDT",
    name: "Ethereum",
    price: "$3,512.75",
    change: "+ 1.65%",
    isUp: true,
    iconBg: "#627eea",
    iconText: "Ξ",
  },
  {
    symbol: "BNB / USDT",
    name: "BNB",
    price: "$602.45",
    change: "+ 0.85%",
    isUp: true,
    iconBg: "#f3ba2f",
    iconText: "B",
  },
  {
    symbol: "SOL / USDT",
    name: "Solana",
    price: "$142.35",
    change: "+ 1.25%",
    isUp: true,
    iconBg: "#14f195",
    iconText: "S",
  },
  {
    symbol: "XRP / USDT",
    name: "XRP",
    price: "$0.5987",
    change: "- 0.35%",
    isUp: false,
    iconBg: "#23292f",
    iconText: "✕",
  },
];

const PortfolioPerformance = () => {
  const [activeTab, setActiveTab] = useState("1M");
  const chart = useChartTheme();

  const currentDataset = timeframeData[activeTab];

  const chartData = {
    labels: currentDataset.xLabels || currentDataset.labels,
    datasets: [
      {
        data: currentDataset.data,
        borderColor: chart.accent,
        borderWidth: 2,
        tension: 0.38,
        fill: true,
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, `rgba(${chart.accentRgb}, 0.28)`);
          gradient.addColorStop(0.6, `rgba(${chart.accentRgb}, 0.05)`);
          gradient.addColorStop(1, `rgba(${chart.accentRgb}, 0)`);
          return gradient;
        },
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: chart.accent,
        pointHoverBorderColor: chart.tooltipBg,
        pointHoverBorderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: chart.tooltipBg,
        titleColor: chart.tooltipTitle,
        bodyColor: chart.accentInk,
        borderColor: chart.tooltipBorder,
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          label: (context) => `$${context.raw.toLocaleString()}K`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: chart.tick,
          font: { size: 12 },
        },
      },
      y: {
        position: "left",
        grid: {
          color: chart.gridFaint,
          drawBorder: false,
        },
        ticks: {
          color: chart.tick,
          font: { size: 12 },
          callback: (value) => `$${value}K`,
        },
        min: 680,
        max: 920,
      },
    },
  };

  return (
    <section className="portfolio-perf-wrapper width-100">
      <div className="row g-3">
        {/* Left Side: Portfolio Performance Chart */}
        <div className="col-12 col-xl-8">
          <div className="pp-card h-100">
            {/* Header */}
            <div className="pp-header">
              <div className="pp-title-group">
                <span className="pp-title">Portfolio Performance</span>
                <Info size={15} className="pp-info-icon" />
              </div>

              {/* Timeframe selector */}
              <div className="pp-tabs">
                {["1D", "1W", "1M", "3M", "1Y", "ALL"].map((tab) => (
                  <button
                    key={tab}
                    className={`pp-tab-btn ${activeTab === tab ? "active" : ""}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Value Display */}
            <div className="pp-value-row">
              <h1 className="pp-main-value">$847,234.56</h1>
              <span className="pp-badge-up">▲ 12.45% (+$93,654.32)</span>
            </div>

            {/* Chart Area */}
            <div className="pp-chart-container">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Right Side: Market Watch List */}
        <div className="col-12 col-xl-4">
          <div className="pp-card h-100">
            {/* Market Watch Header */}
            <div className="mw-header">
              <span className="pp-title">Market Watch</span>
              <button className="mw-view-all">View All</button>
            </div>

            {/* Market Watch Table Header */}
            <div className="mw-table-head">
              <span className="mw-col-market">Market</span>
              <span className="mw-col-price">Price</span>
              <span className="mw-col-change">24h Change</span>
            </div>

            {/* Market Watch Asset Rows */}
            <div className="mw-list">
              {marketWatchItems.map((item, idx) => (
                <div className="mw-item-row" key={idx}>
                  <div className="mw-asset-info">
                    <div
                      className="mw-symbol-icon"
                      style={{ backgroundColor: item.iconBg }}
                    >
                      {item.iconText}
                    </div>
                    <div className="mw-asset-names">
                      <span className="mw-symbol-text">{item.symbol}</span>
                      <span className="mw-name-text">{item.name}</span>
                    </div>
                  </div>

                  <span className="mw-price-text">{item.price}</span>

                  <div className="mw-change-col">
                    <span
                      className={`mw-badge ${
                        item.isUp ? "mw-badge--up" : "mw-badge--down"
                      }`}
                    >
                      {item.isUp ? "▲" : "▼"} {item.change.replace(/[+-]/g, "").trim()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PortfolioPerformance;