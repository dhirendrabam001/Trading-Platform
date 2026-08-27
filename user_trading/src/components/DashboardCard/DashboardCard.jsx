import "./DashboardCard.css";
import { Wallet, BarChart2, Briefcase, TrendingUp } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip as ChartTooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import useChartTheme from "../../utils/chartTheme";
import {
  useGetPortfolioSummaryQuery,
  useGetOrdersQuery,
} from "../../redux/api/tradingApi";

/* Sparkline series colours.
   The dark set is tuned for a near-black ground. On white, mint, lilac and
   salmon all fall below 2:1 and the sparkline reads as a smudge, so light
   mode uses deeper variants of the same four hues. */
const SERIES = {
  dark: {
    green: { stroke: "#00ffb2", rgb: "0,255,178" },
    blue: { stroke: "#3b82f6", rgb: "59,130,246" },
    purple: { stroke: "#a78bfa", rgb: "167,139,250" },
    red: { stroke: "#f87171", rgb: "248,113,113" },
  },
  light: {
    green: { stroke: "#00875a", rgb: "0,135,90" },
    blue: { stroke: "#2563eb", rgb: "37,99,235" },
    purple: { stroke: "#7c3aed", rgb: "124,58,237" },
    red: { stroke: "#d1274b", rgb: "209,39,75" },
  },
};

/* ── Register chart.js modules once ─────────────────────── */
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  ChartTooltip
);

/* ─────────────────────────────────────────────────────────
   Spark data — matching the exact wave shapes from reference:
   Green  : Smooth ascending wave curve
   Blue   : Multi-wave upward slope with crisp peaks
   Purple : High-frequency oscillating waves
   Red    : Sharp drop rebound leading to higher peaks
───────────────────────────────────────────────────────── */
const SPARKS = {
  green:  [12, 14, 22, 20, 28, 30, 26, 38, 42, 38, 52, 58, 52, 68, 76, 68, 85, 98, 88, 92],
  blue:   [15, 20, 18, 25, 30, 24, 32, 38, 32, 48, 56, 44, 62, 58, 70, 78, 72, 88, 95, 86],
  purple: [14, 18, 12, 22, 28, 20, 36, 42, 35, 55, 62, 52, 70, 78, 65, 84, 92, 80, 72, 76],
  red:    [22, 16, 12, 24, 32, 28, 42, 38, 52, 60, 52, 70, 78, 68, 85, 80, 94, 98, 86, 90],
};

/* ─────────────────────────────────────────────────────────
   Build chart.js dataset config
───────────────────────────────────────────────────────── */
function makeChartData(values, strokeHex, gradRgb) {
  return {
    labels: values.map(() => ""),
    datasets: [
      {
        data: values,
        borderColor: strokeHex,
        borderWidth: 2,
        tension: 0.38, // Smooth bezier curves matching reference image
        fill: true,
        backgroundColor: (ctx) => {
          const canvas = ctx.chart.ctx;
          const { chartArea } = ctx.chart;
          if (!chartArea) return "transparent";
          const grad = canvas.createLinearGradient(
            0, chartArea.top, 0, chartArea.bottom
          );
          grad.addColorStop(0, `rgba(${gradRgb}, 0.38)`);
          grad.addColorStop(0.65, `rgba(${gradRgb}, 0.08)`);
          grad.addColorStop(1, `rgba(${gradRgb}, 0)`);
          return grad;
        },
        pointRadius: 0,
        pointHoverRadius: 0,
        pointHitRadius: 0,
      },
    ],
  };
}

/* ─────────────────────────────────────────────────────────
   Shared chart.js options — no axes, no grid, no labels
───────────────────────────────────────────────────────── */
const CHART_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 1200, easing: "easeInOutQuart" },
  layout: {
    padding: { top: 4, bottom: 2, left: 2, right: 2 },
  },
  plugins: {
    legend:  { display: false },
    tooltip: { enabled: false },
  },
  scales: {
    x: { display: false },
    y: { 
      display: false,
      grace: "5%",
    },
  },
  elements: {
    line: { borderCapStyle: "round", borderJoinStyle: "round" },
  },
};

/* ─────────────────────────────────────────────────────────
   Card definitions
───────────────────────────────────────────────────────── */
/* ── Formatting helpers ─────────────────────────────────── */

const money = (value) =>
  `$${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const signed = (value) => `${value >= 0 ? "+" : "−"} ${money(Math.abs(value))}`;

const pct = (value) =>
  `${value >= 0 ? "▲" : "▼"} ${Math.abs(value || 0).toFixed(2)}%`;

/**
 * Builds the four cards from live figures.
 *
 * Written as a function of the API response rather than a fixed array, so
 * the layout stays in one place and only the numbers change.
 */
const buildCards = (summary, openOrders) => [
  {
    id: "portfolio",
    title: "Total Portfolio Value",
    value: money(summary.netWorth),
    badge: pct(summary.change24Percent),
    badgeType: summary.change24Percent >= 0 ? "up" : "down",
    sub: `${signed(summary.change24)} in 24h`,
    subColor: summary.change24 >= 0 ? "green" : "red",
    icon: <Wallet size={18} />,
    iconCls: "green",
    series: "green",
    spark: SPARKS.green,
  },
  {
    id: "balance",
    title: "Available Balance",
    value: money(summary.cash),
    badge: summary.quote || "USDT",
    badgeType: "neutral",
    sub: "Available to trade",
    subColor: "muted",
    icon: <BarChart2 size={18} />,
    iconCls: "blue",
    series: "blue",
    spark: SPARKS.blue,
  },
  {
    id: "positions",
    title: "Open Orders",
    value: String(openOrders),
    badge: openOrders > 0 ? "Working" : "None",
    badgeType: "neutral",
    sub: `Across ${summary.holdingsCount} held assets`,
    subColor: "muted",
    icon: <Briefcase size={18} />,
    iconCls: "purple",
    series: "purple",
    spark: SPARKS.purple,
  },
  {
    id: "pnl",
    title: "Unrealised P&L",
    value: money(summary.unrealisedPnl),
    badge: pct(summary.unrealisedPercent),
    badgeType: summary.unrealisedPnl >= 0 ? "up" : "down",
    sub: `${signed(summary.realisedPnl)} realised`,
    subColor: summary.realisedPnl >= 0 ? "green" : "red",
    icon: <TrendingUp size={18} />,
    iconCls: "red",
    series: "red",
    spark: SPARKS.red,
  },
];

/* ─────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────── */
const DashboardCard = () => {
  const { theme } = useChartTheme();
  const palette = SERIES[theme] || SERIES.dark;

  /* Live figures from the API. While the first request is in flight the
     fallback below keeps every field a number, so the cards render their
     real layout with zeros rather than blanking out or crashing on
     undefined. */
  const { data: summaryData } = useGetPortfolioSummaryQuery();
  const { data: ordersData } = useGetOrdersQuery({ status: "open", limit: 1 });

  const summary = summaryData?.summary ?? {
    netWorth: 0,
    cash: 0,
    unrealisedPnl: 0,
    unrealisedPercent: 0,
    realisedPnl: 0,
    change24: 0,
    change24Percent: 0,
    holdingsCount: 0,
    quote: "USDT",
  };

  const cards = buildCards(summary, ordersData?.total ?? 0);

  return (
  <section className="dashboard-info">
    <div className="row g-3">
      {cards.map((c) => (
        <div className="col-6 col-lg-3 col-md-6" key={c.id}>
          <div className="dc-card">

            {/* Row 1 — icon + badge */}
            <div className="dc-top">
              <span className={`dc-icon dc-icon--${c.iconCls}`}>{c.icon}</span>
              <span className={`dc-badge dc-badge--${c.badgeType}`}>{c.badge}</span>
            </div>

            {/* Row 2 — title */}
            <p className="dc-title">{c.title}</p>

            {/* Row 3 — big value */}
            <h2 className="dc-value">{c.value}</h2>

            {/* Row 4 — sub-text left | sparkline right */}
            <div className="dc-foot">
              <p className={`dc-sub dc-sub--${c.subColor}`}>{c.sub}</p>
              <div className="dc-spark">
                <Line
                  data={makeChartData(
                    c.spark,
                    palette[c.series].stroke,
                    palette[c.series].rgb,
                  )}
                  options={CHART_OPTS}
                />
              </div>
            </div>

          </div>
        </div>
      ))}
    </div>
  </section>
  );
};

export default DashboardCard;
