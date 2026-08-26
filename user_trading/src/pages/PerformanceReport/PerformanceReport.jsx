import { useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip as ChartTooltip,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Award,
  AlertTriangle,
  Download,
  Gauge,
  Target,
  Percent,
  Scale,
  ArrowDown,
} from "lucide-react";
import "./PerformanceReport.css";
import useChartTheme from "../../utils/chartTheme";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ChartTooltip,
  Filler,
);

/* ================================================================== data ===
   Only the monthly percentage returns are stored, for the account and for the
   benchmark it is measured against. Everything on this page - the equity
   curve, cumulative return, CAGR, volatility, drawdown, Sharpe - is DERIVED
   from those two series, so no headline figure can drift away from the
   months it is supposed to summarise. */

const MONTHS = [
  { label: "Sep", portfolio: 3.2, benchmark: 2.1 },
  { label: "Oct", portfolio: 5.8, benchmark: 4.4 },
  { label: "Nov", portfolio: -2.4, benchmark: -3.8 },
  { label: "Dec", portfolio: 7.1, benchmark: 5.2 },
  { label: "Jan", portfolio: 4.3, benchmark: 6.1 },
  { label: "Feb", portfolio: -5.6, benchmark: -7.2 },
  { label: "Mar", portfolio: 9.4, benchmark: 8.0 },
  { label: "Apr", portfolio: 2.7, benchmark: 1.4 },
  { label: "May", portfolio: -1.8, benchmark: -2.6 },
  { label: "Jun", portfolio: 6.2, benchmark: 3.9 },
  { label: "Jul", portfolio: 8.1, benchmark: 7.3 },
  { label: "Aug", portfolio: 3.5, benchmark: 4.8 },
];

const STARTING_EQUITY = 100000;
/* Annual risk-free rate used by the Sharpe calculation. Named rather than
   buried as a magic 0.04, because the ratio is meaningless without knowing
   what it was measured against. */
const RISK_FREE_ANNUAL = 0.04;
const BENCHMARK_LABEL = "BTC";

const PERIODS = ["3M", "6M", "1Y", "All"];

/* ============================================================== derived ===*/

/* Compound a series of percentage returns into an equity curve. Returns
   compound, they do not add: +10% then -10% is 99, not 100. */
const buildCurve = (returns, start) => {
  const curve = [start];
  let value = start;
  for (const r of returns) {
    value *= 1 + r / 100;
    curve.push(value);
  }
  return curve;
};

/* Largest peak-to-trough fall, as a negative percentage. Walks the curve
   tracking the running high, which is the only way to catch a drawdown that
   spans several months rather than a single bad one. */
const maxDrawdown = (curve) => {
  let peak = curve[0];
  let worst = 0;
  for (const value of curve) {
    if (value > peak) peak = value;
    const fall = ((value - peak) / peak) * 100;
    if (fall < worst) worst = fall;
  }
  return worst;
};

const stdev = (values) => {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  // Sample variance (n-1): these are a sample of returns, not the population
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
};

const analyse = (months, key) => {
  const returns = months.map((m) => m[key]);
  const curve = buildCurve(returns, STARTING_EQUITY);
  const final = curve[curve.length - 1];
  const totalReturn = ((final - STARTING_EQUITY) / STARTING_EQUITY) * 100;

  const years = months.length / 12;
  /* Compound annual growth rate, not the simple total divided by years -
     they only agree when the period is exactly one year. */
  const cagr = (Math.pow(final / STARTING_EQUITY, 1 / years) - 1) * 100;

  // Monthly deviation scaled to a year by the square root of time
  const volatility = stdev(returns) * Math.sqrt(12);
  const drawdown = maxDrawdown(curve);
  const wins = returns.filter((r) => r > 0);

  return {
    returns,
    curve,
    final,
    totalReturn,
    cagr,
    volatility,
    drawdown,
    sharpe: volatility > 0 ? (cagr - RISK_FREE_ANNUAL * 100) / volatility : 0,
    winRate: (wins.length / returns.length) * 100,
    wins: wins.length,
    losses: returns.length - wins.length,
    best: Math.max(...returns),
    worst: Math.min(...returns),
    avgWin: wins.length ? wins.reduce((a, b) => a + b, 0) / wins.length : 0,
    avgLoss:
      returns.length - wins.length
        ? returns
            .filter((r) => r <= 0)
            .reduce((a, b) => a + b, 0) /
          (returns.length - wins.length)
        : 0,
  };
};

const PORTFOLIO = analyse(MONTHS, "portfolio");
const BENCHMARK = analyse(MONTHS, "benchmark");
/* Excess return over the benchmark - the number that answers "was this worth
   doing versus just holding?" */
const ALPHA = PORTFOLIO.totalReturn - BENCHMARK.totalReturn;

/* Drawdown at every point, for the underwater chart */
const DRAWDOWN_SERIES = (() => {
  let peak = PORTFOLIO.curve[0];
  return PORTFOLIO.curve.map((value) => {
    if (value > peak) peak = value;
    return ((value - peak) / peak) * 100;
  });
})();

const BEST_MONTH = MONTHS.reduce((a, b) => (b.portfolio > a.portfolio ? b : a));
const WORST_MONTH = MONTHS.reduce((a, b) => (b.portfolio < a.portfolio ? b : a));

/* =============================================================== format ===*/

const money = (value, dp = 2) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });

const pct = (value, dp = 2) =>
  `${value >= 0 ? "+" : ""}${value.toFixed(dp)}%`;

/* ============================================================= component ===*/

const PerformanceReport = () => {
  const [period, setPeriod] = useState("1Y");
  const chart = useChartTheme();

  const labels = useMemo(
    () => ["Start", ...MONTHS.map((m) => m.label)],
    [],
  );

  const curveData = {
    labels,
    datasets: [
      {
        label: "Portfolio",
        data: PORTFOLIO.curve,
        borderColor: chart.accent,
        borderWidth: 2,
        tension: 0.35,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: chart.accent,
        pointHoverBorderColor: chart.tooltipBg,
        pointHoverBorderWidth: 2,
        fill: true,
        backgroundColor: (context) => {
          const { ctx, chartArea } = context.chart;
          // chartArea is undefined on the first layout pass
          if (!chartArea) return `rgba(${chart.accentRgb}, 0.12)`;
          const gradient = ctx.createLinearGradient(
            0,
            chartArea.top,
            0,
            chartArea.bottom,
          );
          gradient.addColorStop(0, `rgba(${chart.accentRgb}, 0.28)`);
          gradient.addColorStop(0.7, `rgba(${chart.accentRgb}, 0.04)`);
          gradient.addColorStop(1, `rgba(${chart.accentRgb}, 0)`);
          return gradient;
        },
      },
      {
        label: BENCHMARK_LABEL,
        data: BENCHMARK.curve,
        borderColor: chart.tick,
        borderWidth: 1.5,
        // Dashed so the benchmark reads as a reference line, not a second
        // portfolio competing for attention
        borderDash: [5, 4],
        tension: 0.35,
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: false,
      },
    ],
  };

  const curveOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: chart.tooltipBg,
        titleColor: chart.tooltipTitle,
        bodyColor: chart.tooltipBody,
        borderColor: chart.tooltipBorder,
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (item) => `${item.dataset.label}: $${money(item.parsed.y, 0)}`,
        },
      },
    },
    scales: {
      x: {
        border: { display: false },
        grid: { display: false },
        ticks: { color: chart.tick, font: { size: 11 }, maxRotation: 0 },
      },
      y: {
        position: "right",
        border: { display: false },
        grid: { color: chart.gridFaint },
        ticks: {
          color: chart.tick,
          font: { size: 11 },
          callback: (value) => `$${(value / 1000).toFixed(0)}k`,
        },
      },
    },
  };

  const monthlyData = {
    labels: MONTHS.map((m) => m.label),
    datasets: [
      {
        data: PORTFOLIO.returns,
        backgroundColor: PORTFOLIO.returns.map((r) =>
          r >= 0 ? chart.up : chart.down,
        ),
        borderRadius: 4,
        borderSkipped: false,
        maxBarThickness: 30,
      },
    ],
  };

  const monthlyOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: chart.tooltipBg,
        titleColor: chart.tooltipTitle,
        bodyColor: chart.tooltipBody,
        borderColor: chart.tooltipBorder,
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: { label: (item) => pct(item.parsed.y) },
      },
    },
    scales: {
      x: {
        border: { display: false },
        grid: { display: false },
        ticks: { color: chart.tick, font: { size: 11 }, maxRotation: 0 },
      },
      y: {
        position: "right",
        border: { display: false },
        grid: { color: chart.gridFaint },
        ticks: {
          color: chart.tick,
          font: { size: 11 },
          callback: (value) => `${value}%`,
        },
      },
    },
  };

  const metrics = [
    {
      key: "total",
      icon: PORTFOLIO.totalReturn >= 0 ? TrendingUp : TrendingDown,
      label: "Total Return",
      value: pct(PORTFOLIO.totalReturn),
      sub: `$${money(PORTFOLIO.final - STARTING_EQUITY, 0)} gained`,
      tone: PORTFOLIO.totalReturn >= 0 ? "up" : "down",
    },
    {
      key: "cagr",
      icon: Activity,
      label: "Annualised (CAGR)",
      value: pct(PORTFOLIO.cagr),
      sub: `over ${MONTHS.length} months`,
      tone: PORTFOLIO.cagr >= 0 ? "up" : "down",
    },
    {
      key: "dd",
      icon: ArrowDown,
      label: "Max Drawdown",
      value: `${PORTFOLIO.drawdown.toFixed(2)}%`,
      sub: "Largest peak-to-trough",
      tone: "down",
    },
    {
      key: "sharpe",
      icon: Gauge,
      label: "Sharpe Ratio",
      value: PORTFOLIO.sharpe.toFixed(2),
      sub: `vs ${(RISK_FREE_ANNUAL * 100).toFixed(0)}% risk-free`,
      tone: PORTFOLIO.sharpe >= 1 ? "up" : "warn",
    },
  ];

  return (
    <section className="pr-page">
      {/* ============================ HEADER =========================== */}
      <header className="pr-header">
        <div className="pr-heading">
          <span className="pr-heading-icon">
            <Activity size={19} />
          </span>
          <div>
            <h1 className="pr-title">Performance Report</h1>
            <p className="pr-subtitle">
              How the account has performed against {BENCHMARK_LABEL}, with the
              risk taken to get there.
            </p>
          </div>
        </div>

        <div className="pr-header-actions">
          <div className="pr-period" role="group" aria-label="Reporting period">
            {PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                className={period === p ? "is-active" : ""}
                onClick={() => setPeriod(p)}
              >
                {p}
              </button>
            ))}
          </div>
          <button type="button" className="pr-btn pr-btn--ghost">
            <Download size={14} /> Export
          </button>
        </div>
      </header>

      {/* ============================ METRICS ========================== */}
      <div className="pr-metrics">
        {metrics.map(({ key, icon: Icon, label, value, sub, tone }) => (
          <div className={`pr-card pr-metric is-${tone}`} key={key}>
            <span className="pr-metric-icon">
              <Icon size={16} />
            </span>
            <div className="pr-metric-body">
              <span className="pr-metric-label">{label}</span>
              <strong className="pr-metric-value">{value}</strong>
              <span className="pr-metric-sub">{sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ============================= GRID ============================ */}
      <div className="pr-grid">
        <div className="pr-col-main">
          {/* ------------------------ EQUITY CURVE ------------------- */}
          <div className="pr-card">
            <div className="pr-chart-head">
              <div>
                <h2 className="pr-card-title">Growth of $100,000</h2>
                <div className="pr-chart-figure">
                  <strong>${money(PORTFOLIO.final, 0)}</strong>
                  <span
                    className={`pr-delta ${PORTFOLIO.totalReturn >= 0 ? "is-up" : "is-down"}`}
                  >
                    {pct(PORTFOLIO.totalReturn)}
                  </span>
                </div>
              </div>

              <div className="pr-series-key">
                <span className="pr-key">
                  <i className="pr-key-line is-portfolio" /> Portfolio
                </span>
                <span className="pr-key">
                  <i className="pr-key-line is-benchmark" /> {BENCHMARK_LABEL}
                </span>
              </div>
            </div>

            <div className="pr-chart-body">
              <Line data={curveData} options={curveOptions} />
            </div>

            <div className="pr-versus">
              <div>
                <span className="pr-muted">Portfolio</span>
                <b className={PORTFOLIO.totalReturn >= 0 ? "pr-up" : "pr-down"}>
                  {pct(PORTFOLIO.totalReturn)}
                </b>
              </div>
              <div>
                <span className="pr-muted">{BENCHMARK_LABEL}</span>
                <b className={BENCHMARK.totalReturn >= 0 ? "pr-up" : "pr-down"}>
                  {pct(BENCHMARK.totalReturn)}
                </b>
              </div>
              <div className="pr-versus-alpha">
                <span className="pr-muted">Excess return</span>
                <b className={ALPHA >= 0 ? "pr-up" : "pr-down"}>{pct(ALPHA)}</b>
              </div>
            </div>
          </div>

          {/* --------------------- MONTHLY RETURNS ------------------- */}
          <div className="pr-card">
            <div className="pr-chart-head">
              <div>
                <h2 className="pr-card-title">Monthly Returns</h2>
                <p className="pr-step-note">
                  {PORTFOLIO.wins} up months, {PORTFOLIO.losses} down —{" "}
                  {PORTFOLIO.winRate.toFixed(0)}% positive
                </p>
              </div>
            </div>

            <div className="pr-chart-body is-short">
              <Bar data={monthlyData} options={monthlyOptions} />
            </div>

            {/* The same numbers as chips, so a month can be read exactly
                rather than estimated off the axis */}
            <div className="pr-month-grid">
              {MONTHS.map((m) => (
                <div
                  key={m.label}
                  className={`pr-month ${m.portfolio >= 0 ? "is-up" : "is-down"}`}
                >
                  <span>{m.label}</span>
                  <b>{pct(m.portfolio, 1)}</b>
                </div>
              ))}
            </div>
          </div>

          {/* --------------------- RISK & RETURN --------------------- */}
          <div className="pr-card">
            <h2 className="pr-card-title">
              <Scale size={14} /> Portfolio vs {BENCHMARK_LABEL}
            </h2>

            <div className="pr-table-scroll">
              <table className="pr-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th className="pr-num">Portfolio</th>
                    <th className="pr-num">{BENCHMARK_LABEL}</th>
                    <th className="pr-num">Difference</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Total Return", p: PORTFOLIO.totalReturn, b: BENCHMARK.totalReturn, suffix: "%", better: "high" },
                    { label: "Annualised (CAGR)", p: PORTFOLIO.cagr, b: BENCHMARK.cagr, suffix: "%", better: "high" },
                    { label: "Volatility", p: PORTFOLIO.volatility, b: BENCHMARK.volatility, suffix: "%", better: "low" },
                    { label: "Max Drawdown", p: PORTFOLIO.drawdown, b: BENCHMARK.drawdown, suffix: "%", better: "high" },
                    { label: "Sharpe Ratio", p: PORTFOLIO.sharpe, b: BENCHMARK.sharpe, suffix: "", better: "high" },
                    { label: "Best Month", p: PORTFOLIO.best, b: BENCHMARK.best, suffix: "%", better: "high" },
                    { label: "Worst Month", p: PORTFOLIO.worst, b: BENCHMARK.worst, suffix: "%", better: "high" },
                    { label: "Win Rate", p: PORTFOLIO.winRate, b: BENCHMARK.winRate, suffix: "%", better: "high" },
                  ].map((row) => {
                    const diff = row.p - row.b;
                    /* For volatility and drawdown a LOWER number is better,
                       so the colour cannot simply follow the sign */
                    const good = row.better === "low" ? diff < 0 : diff > 0;

                    return (
                      <tr key={row.label}>
                        <td data-label="Metric" className="pr-strong">
                          {row.label}
                        </td>
                        <td data-label="Portfolio" className="pr-num pr-strong">
                          {row.p.toFixed(2)}
                          {row.suffix}
                        </td>
                        <td data-label={BENCHMARK_LABEL} className="pr-num pr-muted">
                          {row.b.toFixed(2)}
                          {row.suffix}
                        </td>
                        <td data-label="Difference" className="pr-num">
                          <span className={good ? "pr-up" : "pr-down"}>
                            {diff >= 0 ? "+" : ""}
                            {diff.toFixed(2)}
                            {row.suffix}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* -------------------------- SIDE RAIL ----------------------- */}
        <aside className="pr-side">
          <div className="pr-card">
            <h2 className="pr-card-title">
              <ArrowDown size={14} /> Drawdown
            </h2>

            <div className="pr-dd-figure">
              <strong className="pr-down">
                {PORTFOLIO.drawdown.toFixed(2)}%
              </strong>
              <span className="pr-muted">maximum peak-to-trough</span>
            </div>

            {/* Underwater plot: each bar is how far below the running high
                the account was that month. Empty means at a new high. */}
            <div className="pr-underwater">
              {DRAWDOWN_SERIES.map((d, i) => (
                <span
                  key={i}
                  className="pr-uw-slot"
                  title={`${d.toFixed(2)}%`}
                >
                  <i
                    style={{
                      height: `${Math.min(100, (Math.abs(d) / Math.abs(PORTFOLIO.drawdown || 1)) * 100)}%`,
                    }}
                  />
                </span>
              ))}
            </div>

            <p className="pr-note">
              Currently{" "}
              {Math.abs(DRAWDOWN_SERIES[DRAWDOWN_SERIES.length - 1]) < 0.005
                ? "at an all-time high"
                : `${DRAWDOWN_SERIES[DRAWDOWN_SERIES.length - 1].toFixed(2)}% below the peak`}
              .
            </p>
          </div>

          <div className="pr-card">
            <h2 className="pr-card-title">
              <Percent size={14} /> Risk Metrics
            </h2>

            <dl className="pr-summary">
              <div>
                <dt>Volatility (ann.)</dt>
                <dd>{PORTFOLIO.volatility.toFixed(2)}%</dd>
              </div>
              <div>
                <dt>Sharpe Ratio</dt>
                <dd className={PORTFOLIO.sharpe >= 1 ? "pr-up" : "pr-warn"}>
                  {PORTFOLIO.sharpe.toFixed(2)}
                </dd>
              </div>
              <div>
                <dt>Win Rate</dt>
                <dd className="pr-up">{PORTFOLIO.winRate.toFixed(1)}%</dd>
              </div>
              <div>
                <dt>Avg. Up Month</dt>
                <dd className="pr-up">{pct(PORTFOLIO.avgWin)}</dd>
              </div>
              <div>
                <dt>Avg. Down Month</dt>
                <dd className="pr-down">{pct(PORTFOLIO.avgLoss)}</dd>
              </div>
              <div>
                <dt>Excess vs {BENCHMARK_LABEL}</dt>
                <dd className={ALPHA >= 0 ? "pr-up" : "pr-down"}>
                  {pct(ALPHA)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="pr-card">
            <h2 className="pr-card-title">
              <Award size={14} /> Highlights
            </h2>

            <div className="pr-highlights">
              <div className="pr-highlight is-up">
                <span className="pr-highlight-icon">
                  <Target size={15} />
                </span>
                <span className="pr-highlight-body">
                  <b>Best month</b>
                  <small>{BEST_MONTH.label}</small>
                </span>
                <b className="pr-up">{pct(BEST_MONTH.portfolio, 1)}</b>
              </div>

              <div className="pr-highlight is-down">
                <span className="pr-highlight-icon">
                  <AlertTriangle size={15} />
                </span>
                <span className="pr-highlight-body">
                  <b>Worst month</b>
                  <small>{WORST_MONTH.label}</small>
                </span>
                <b className="pr-down">{pct(WORST_MONTH.portfolio, 1)}</b>
              </div>
            </div>

            <p className="pr-note">
              Figures are derived from {MONTHS.length} months of returns
              compounded from a ${money(STARTING_EQUITY, 0)} starting balance.
              Sharpe is measured against a{" "}
              {(RISK_FREE_ANNUAL * 100).toFixed(0)}% risk-free rate.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default PerformanceReport;
