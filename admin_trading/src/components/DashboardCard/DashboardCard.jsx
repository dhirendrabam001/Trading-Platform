import "./DashboardCard.css";
// Canonical lucide names. BarChart2/Briefcase still resolve as deprecated
// aliases, but those are scheduled for removal upstream.
import { Users, ChartColumn, ArrowLeftRight, DollarSign } from "lucide-react";
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

/* ── Register chart.js modules once ─────────────────────── */
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  ChartTooltip,
);

/* ─────────────────────────────────────────────────────────
   Spark data — matching the exact wave shapes from reference:
   Green  : Smooth ascending wave curve
   Blue   : Multi-wave upward slope with crisp peaks
   Purple : High-frequency oscillating waves
   Red    : Sharp drop rebound leading to higher peaks
───────────────────────────────────────────────────────── */
const SPARKS = {
  green: [
    12, 14, 22, 20, 28, 30, 26, 38, 42, 38, 52, 58, 52, 68, 76, 68, 85, 98, 88,
    92,
  ],
  blue: [
    15, 20, 18, 25, 30, 24, 32, 38, 32, 48, 56, 44, 62, 58, 70, 78, 72, 88, 95,
    86,
  ],
  purple: [
    14, 18, 12, 22, 28, 20, 36, 42, 35, 55, 62, 52, 70, 78, 65, 84, 92, 80, 72,
    76,
  ],
  red: [
    22, 16, 12, 24, 32, 28, 42, 38, 52, 60, 52, 70, 78, 68, 85, 80, 94, 98, 86,
    90,
  ],
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
            0,
            chartArea.top,
            0,
            chartArea.bottom,
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
    legend: { display: false },
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
const CARDS = [
  {
    id: "users",
    title: "Total Users",
    value: "24,853",
    change: "+12.45%",
    period: "from last week",
    icon: <Users size={18} />,
    tone: "green",
    stroke: "#00ffb2",
    gradRgb: "0,255,178",
    spark: SPARKS.green,
  },
  {
    id: "volume",
    title: "Total Volume",
    value: "$24,562,341",
    change: "+8.32%",
    period: "from last week",
    icon: <ChartColumn size={18} />,
    tone: "blue",
    stroke: "#3b82f6",
    gradRgb: "59,130,246",
    spark: SPARKS.blue,
  },
  {
    id: "trades",
    title: "Total Trades",
    value: "156,789",
    change: "+15.21%",
    period: "from last week",
    icon: <ArrowLeftRight size={18} />,
    tone: "purple",
    stroke: "#a78bfa",
    gradRgb: "167,139,250",
    spark: SPARKS.purple,
  },
  {
    id: "revenue",
    title: "Total Revenue",
    value: "$245,678",
    change: "+10.45%",
    period: "from last week",
    icon: <DollarSign size={18} />,
    tone: "red",
    stroke: "#f87171",
    gradRgb: "248,113,113",
    spark: SPARKS.red,
  },
];

/* ─────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────── */
const DashboardCard = () => (
  <section className="dashboard-info">
    <div className="row g-3">
      {CARDS.map((c) => (
        <div className="col-12 col-lg-3 col-md-6" key={c.id}>
          <div className="dc-card">
            {/* Row 1 — title + icon */}
            <div className="dc-top">
              <p className="dc-title">{c.title}</p>
              <span className={`dc-icon dc-icon--${c.tone}`}>{c.icon}</span>
            </div>

            {/* Row 2 — big value */}
            <h2 className="dc-value">{c.value}</h2>

            {/* Row 3 — change stacked over period | sparkline right */}
            <div className="dc-foot">
              <div className="dc-delta">
                <span className="dc-change">{c.change}</span>
                <span className="dc-period">{c.period}</span>
              </div>
              <div className="dc-spark">
                <Line
                  data={makeChartData(c.spark, c.stroke, c.gradRgb)}
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

export default DashboardCard;
