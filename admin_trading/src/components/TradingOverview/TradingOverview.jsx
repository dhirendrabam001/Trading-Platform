import { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import "./TradingOverview.css";

// Register Chart.js modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const ACCENT = "#00ffb2";

/* Datasets for different timeframes */
const timeframeData = {
  "1w": {
    labels: ["Jul 13", "Jul 14", "Jul 15", "Jul 16", "Jul 17", "Jul 18", "Jul 19"],
    data: [22, 15, 21, 30, 22, 31, 30],
    total: "$24,562,341.00",
    change: "8.32%",
    periodText: "vs last week",
  },
  "1m": {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    data: [18, 25, 20, 35],
    total: "$98,240,110.00",
    change: "12.45%",
    periodText: "vs last month",
  },
  "1y": {
    labels: ["Jan", "Mar", "May", "Jul", "Sep", "Nov"],
    data: [12, 19, 15, 28, 24, 38],
    total: "$1,245,890,000.00",
    change: "24.18%",
    periodText: "vs last year",
  },
};

const timeframes = [
  { id: "1w", label: "1W" },
  { id: "1m", label: "1M" },
  { id: "1y", label: "1Y" },
];

const marketData = [
  { label: "BTC/USDT", percentage: "40.2%", value: 40.2, amount: "$9.87M", color: "#3b82f6" },
  { label: "ETH/USDT", percentage: "25.1%", value: 25.1, amount: "$6.16M", color: "#6366f1" },
  { label: "BNB/USDT", percentage: "15.3%", value: 15.3, amount: "$3.76M", color: "#f59e0b" },
  { label: "SOL/USDT", percentage: "10.7%", value: 10.7, amount: "$2.62M", color: "#8b5cf6" },
  { label: "Others", percentage: "8.7%", value: 8.7, amount: "$2.13M", color: ACCENT },
];

const MARKET_TOTAL = "$24.56M";

/* ================= CHART PLUGINS (module scope so they stay identity-stable) =========== */

/* Center label inside the doughnut, sized off the ring so it scales with the card */
const centerTextPlugin = {
  id: "centerText",
  beforeDraw(chart, _args, options) {
    const { ctx, chartArea } = chart;
    if (!chartArea) return;

    const centerX = (chartArea.left + chartArea.right) / 2;
    const centerY = (chartArea.top + chartArea.bottom) / 2;
    const radius =
      Math.min(chartArea.right - chartArea.left, chartArea.bottom - chartArea.top) / 2;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = `500 ${Math.max(10, radius * 0.15)}px Inter, sans-serif`;
    ctx.fillStyle = "#6b7280";
    ctx.fillText(options?.label ?? "Total", centerX, centerY - radius * 0.15);

    ctx.font = `700 ${Math.max(13, radius * 0.23)}px 'Space Grotesk', sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(options?.value ?? "", centerX, centerY + radius * 0.14);

    ctx.restore();
  },
};

/* Dashed vertical tracker under the cursor — the usual trading-terminal read-out */
const crosshairPlugin = {
  id: "crosshair",
  afterDatasetsDraw(chart) {
    const active = chart.tooltip?.getActiveElements?.() ?? [];
    if (!active.length) return;

    const { ctx, chartArea } = chart;
    const { x } = active[0].element;

    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([4, 5]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(0, 255, 178, 0.35)";
    ctx.moveTo(x, chartArea.top);
    ctx.lineTo(x, chartArea.bottom);
    ctx.stroke();
    ctx.restore();
  },
};

/* Glowing marker on the latest datapoint */
const lastPointGlow = {
  id: "lastPointGlow",
  afterDatasetsDraw(chart) {
    const meta = chart.getDatasetMeta(0);
    const point = meta?.data?.[meta.data.length - 1];
    if (!point) return;

    const { ctx } = chart;
    ctx.save();

    ctx.beginPath();
    ctx.arc(point.x, point.y, 8.5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 255, 178, 0.14)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = ACCENT;
    ctx.shadowColor = ACCENT;
    ctx.shadowBlur = 12;
    ctx.fill();

    ctx.restore();
  },
};

const TradingOverview = () => {
  const [timeframe, setTimeframe] = useState("1w");

  const currentStats = timeframeData[timeframe];
  const activeIndex = timeframes.findIndex((t) => t.id === timeframe);

  /* Round headroom above the peak so the gridlines stay on whole numbers */
  const yMax = Math.ceil((Math.max(...currentStats.data) * 1.15) / 10) * 10;

  /* ================= LINE CHART ================= */
  const lineData = {
    labels: currentStats.labels,
    datasets: [
      {
        data: currentStats.data,
        borderColor: ACCENT,
        borderWidth: 2,
        tension: 0.42,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: ACCENT,
        pointHoverBorderColor: "#04060b",
        pointHoverBorderWidth: 3,
        fill: true,
        // Scriptable so the fill re-generates on every resize instead of
        // being frozen at the height the chart happened to mount with
        backgroundColor: (context) => {
          const { ctx, chartArea } = context.chart;
          if (!chartArea) return "rgba(0, 255, 178, 0.1)";
          const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          g.addColorStop(0, "rgba(0, 255, 178, 0.38)");
          g.addColorStop(0.55, "rgba(0, 255, 178, 0.12)");
          g.addColorStop(1, "rgba(0, 255, 178, 0)");
          return g;
        },
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    // Inner padding, since the canvas now bleeds past the card's own padding
    layout: { padding: { top: 8, right: 12, left: 12 } },
    animation: { duration: 900, easing: "easeOutQuart" },
    // Each point lifts off the baseline, staggered left → right, so the wave
    // grows up out of the axis rather than just fading in
    animations: {
      y: {
        duration: 900,
        easing: "easeOutQuart",
        from: (ctx) => {
          if (ctx.type !== "data" || ctx.mode !== "default") return undefined;
          const yScale = ctx.chart.scales?.y;
          return yScale
            ? yScale.getPixelForValue(yScale.min)
            : ctx.chart.chartArea?.bottom;
        },
        delay: (ctx) =>
          ctx.type === "data" && ctx.mode === "default" ? ctx.index * 70 : 0,
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(9, 14, 24, 0.95)",
        titleColor: "#ffffff",
        titleFont: { size: 11, weight: "500" },
        bodyColor: ACCENT,
        bodyFont: { size: 13, weight: "700" },
        borderColor: "rgba(0, 255, 178, 0.22)",
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        callbacks: { label: (context) => `$${context.raw}M USD` },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: "#6b7280", font: { size: 11 }, padding: 4 },
      },
      y: {
        min: 0,
        max: yMax,
        grid: { color: "rgba(255, 255, 255, 0.045)", drawTicks: false },
        border: { display: false },
        ticks: {
          color: "#6b7280",
          font: { size: 11 },
          padding: 8,
          maxTicksLimit: 5,
          callback: (value) => `$${value}M`,
        },
      },
    },
  };

  /* ================= DOUGHNUT CHART ================= */
  const doughnutData = {
    labels: marketData.map((d) => d.label),
    datasets: [
      {
        data: marketData.map((d) => d.value),
        backgroundColor: marketData.map((d) => d.color),
        borderWidth: 0,
        spacing: 2,
        borderRadius: 4,
        hoverOffset: 5,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "76%",
    animation: { animateScale: true, animateRotate: true, duration: 1000 },
    plugins: {
      legend: { display: false },
      centerText: { label: "Total", value: MARKET_TOTAL },
      tooltip: {
        backgroundColor: "rgba(9, 14, 24, 0.95)",
        borderColor: "rgba(255, 255, 255, 0.12)",
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        callbacks: { label: (context) => `${context.label}: ${context.raw}%` },
      },
    },
  };

  return (
    <div className="row g-3 trading-overview">
      {/* LEFT CARD: Trading Volume Overview */}
      <div className="col-12 col-xl-7">
        <div className="overview-card h-100">
          <div className="ov-head">
            <h5 className="card-title">Trading Volume Overview</h5>

            {/* Segmented timeframe switch */}
            <div className="tf-switch" style={{ "--tf-i": activeIndex }}>
              {timeframes.map((tf) => (
                <button
                  key={tf.id}
                  type="button"
                  className={`tf-btn ${timeframe === tf.id ? "is-active" : ""}`}
                  onClick={() => setTimeframe(tf.id)}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          <div className="ov-stat">
            <h2 className="stat-amount">{currentStats.total}</h2>
            <span className="stat-badge">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4l-8 8h16l-8-8z" />
              </svg>
              {currentStats.change}
            </span>
            <span className="stat-period">{currentStats.periodText}</span>
          </div>

          <div className="chart-container line-chart-wrapper">
            <Line
              data={lineData}
              options={lineOptions}
              plugins={[crosshairPlugin, lastPointGlow]}
            />
          </div>
        </div>
      </div>

      {/* RIGHT CARD: Volume by Market */}
      <div className="col-12 col-xl-5">
        <div className="overview-card h-100">
          <div className="ov-head">
            <h5 className="card-title">Volume by Market</h5>
            <span className="ov-tag">Top 5 pairs</span>
          </div>

          <div className="ov-body">
            <div className="doughnut-wrapper">
              <Doughnut
                data={doughnutData}
                options={doughnutOptions}
                plugins={[centerTextPlugin]}
              />
            </div>

            <div className="market-legend">
              {marketData.map((item, index) => (
                <div key={item.label} className="legend-item" style={{ "--i": index }}>
                  <span className="legend-left">
                    <span
                      className="color-indicator"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="market-name">{item.label}</span>
                  </span>
                  <span className="legend-right">
                    <span className="market-percent">{item.percentage}</span>
                    <span className="market-amount">{item.amount}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="ov-foot">
            <span className="live-label">
              <span className="live-dot" />
              Live market feed
            </span>
            <span className="ov-foot-value">24h volume {MARKET_TOTAL}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingOverview;
