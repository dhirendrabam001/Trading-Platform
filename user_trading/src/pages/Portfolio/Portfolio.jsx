import { useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip as ChartTooltip,
  Filler,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Briefcase,
  Wallet,
  TrendingUp,
  TrendingDown,
  Search,
  ArrowUpDown,
  Download,
  Coins,
  Percent,
  Award,
} from "lucide-react";
import "./Portfolio.css";
import useChartTheme from "../../utils/chartTheme";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  ChartTooltip,
  Filler,
);

/* ================================================================== data ===
   Only the raw facts of each holding are stored - how much is held, the
   average price it was bought at, and the current price. Everything a trader
   reads (market value, cost basis, P&L, allocation share) is DERIVED below,
   so the table can never show a P&L that disagrees with its own cost and
   price. */

const HOLDINGS = [
  { sym: "BTC",  name: "Bitcoin",   key: "btc",  qty: 0.842,  avg: 58420.5, price: 67245.8, change24: 2.45 },
  { sym: "ETH",  name: "Ethereum",  key: "eth",  qty: 9.15,   avg: 3120.4,  price: 3512.75, change24: 1.65 },
  { sym: "SOL",  name: "Solana",    key: "sol",  qty: 148.2,  avg: 118.65,  price: 142.35,  change24: 1.25 },
  { sym: "BNB",  name: "BNB",       key: "bnb",  qty: 21.4,   avg: 542.1,   price: 602.45,  change24: 0.85 },
  { sym: "XRP",  name: "XRP",       key: "xrp",  qty: 14200,  avg: 0.6488,  price: 0.5987,  change24: -0.35 },
  { sym: "AVAX", name: "Avalanche", key: "avax", qty: 312,    avg: 38.9,    price: 35.42,   change24: 3.12 },
  { sym: "LINK", name: "Chainlink", key: "link", qty: 486,    avg: 13.05,   price: 16.25,   change24: 4.32 },
  { sym: "ADA",  name: "Cardano",   key: "ada",  qty: 18500,  avg: 0.5124,  price: 0.4567,  change24: 0.78 },
];

const CASH = 24562.34;

/* Asset-brand colours: these identify a coin, not a surface, so they are
   deliberately literal and stay fixed in both themes. */
const COIN_COLORS = {
  btc: "#f7931a",
  eth: "#627eea",
  sol: "#14f195",
  bnb: "#f3ba2f",
  xrp: "#5c6773",
  avax: "#e84142",
  link: "#2a5ada",
  ada: "#0033ad",
};

const RANGES = ["1W", "1M", "3M", "1Y", "All"];

const TABS = [
  { id: "all", label: "All Assets" },
  { id: "profit", label: "In Profit" },
  { id: "loss", label: "At a Loss" },
];

const SORTS = [
  { id: "value", label: "Market Value" },
  { id: "pnl", label: "Profit & Loss" },
  { id: "pnlPct", label: "Return %" },
  { id: "change", label: "24h Change" },
];

/* ============================================================== derived ===*/

const derive = (holding) => {
  const { qty, avg, price } = holding;
  const value = qty * price;
  const cost = qty * avg;
  const pnl = value - cost;
  const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;

  return { ...holding, value, cost, pnl, pnlPct };
};

const ROWS = HOLDINGS.map(derive);

const INVESTED = ROWS.reduce((sum, r) => sum + r.value, 0);
const COST_BASIS = ROWS.reduce((sum, r) => sum + r.cost, 0);
const TOTAL_PNL = INVESTED - COST_BASIS;
/* Yesterday's value, backed out of each holding's 24h move, so the headline
   24h change is consistent with the per-row percentages */
const PREV_VALUE = ROWS.reduce(
  (sum, r) => sum + r.value / (1 + r.change24 / 100),
  0,
);
const CHANGE_24 = INVESTED - PREV_VALUE;
const NET_WORTH = INVESTED + CASH;

/* ============================================================ equity curve ===
   Seeded so the series is stable across renders - an unseeded Math.random()
   would redraw a different curve on every keystroke in the search box. Each
   range seeds differently, so switching 1M -> 1Y genuinely changes the shape
   rather than relabelling the same points. */

const mulberry32 = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const buildCurve = (seed, points) => {
  const random = mulberry32(seed);
  const series = [];
  let value = NET_WORTH * 0.72;

  for (let i = 0; i < points; i++) {
    // Gentle upward drift with noise, so the curve reads as a real account
    value *= 1 + (random() - 0.42) * 0.035;
    series.push(value);
  }

  // Anchor the final point to the real net worth, so the chart and the
  // headline balance cannot disagree
  const scale = NET_WORTH / series[series.length - 1];
  return series.map((v) => v * scale);
};

const RANGE_META = {
  "1W": { points: 7, labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
  "1M": { points: 15, labels: null },
  "3M": { points: 24, labels: null },
  "1Y": { points: 12, labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"] },
  All: { points: 30, labels: null },
};

/* =============================================================== format ===*/

const money = (value, dp = 2) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });

/* Sub-dollar assets need significant digits, not two decimals: $0.5987 must
   not round away to $0.60 */
const price = (value) => (value >= 1 ? money(value) : value.toPrecision(4));

const qtyFmt = (value) => money(value, value < 10 ? 4 : value < 1000 ? 2 : 0);

const signed = (value, dp = 2) =>
  `${value >= 0 ? "+" : "-"}$${money(Math.abs(value), dp)}`;

/* ============================================================ components ===*/

const CoinMark = ({ coinKey, sym, size }) => (
  <span
    className={`pf-coin${size ? ` pf-coin--${size}` : ""}`}
    style={{ backgroundColor: COIN_COLORS[coinKey] || "#6b7280" }}
    aria-hidden="true"
  >
    {sym.charAt(0)}
  </span>
);

const Delta = ({ value, suffix = "%" }) => {
  const up = value >= 0;
  return (
    <span className={`pf-delta ${up ? "is-up" : "is-down"}`}>
      {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {up ? "+" : ""}
      {value.toFixed(2)}
      {suffix}
    </span>
  );
};

/* ============================================================= component ===*/

const Portfolio = () => {
  const [range, setRange] = useState("1M");
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("value");

  const chart = useChartTheme();

  const curve = useMemo(() => {
    const meta = RANGE_META[range];
    return buildCurve(RANGES.indexOf(range) * 613 + 29, meta.points);
  }, [range]);

  const curveLabels = useMemo(() => {
    const meta = RANGE_META[range];
    if (meta.labels) return meta.labels.slice(0, meta.points);
    return Array.from({ length: meta.points }, (_, i) => `${i + 1}`);
  }, [range]);

  const curveChange = curve[curve.length - 1] - curve[0];
  const curveChangePct = curve[0] > 0 ? (curveChange / curve[0]) * 100 : 0;

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();

    return ROWS.filter((r) => {
      if (q && !`${r.sym} ${r.name}`.toLowerCase().includes(q)) return false;
      if (tab === "profit") return r.pnl >= 0;
      if (tab === "loss") return r.pnl < 0;
      return true;
    }).sort((a, b) => {
      if (sortBy === "pnl") return b.pnl - a.pnl;
      if (sortBy === "pnlPct") return b.pnlPct - a.pnlPct;
      if (sortBy === "change") return b.change24 - a.change24;
      return b.value - a.value;
    });
  }, [tab, query, sortBy]);

  /* Allocation counts cash as its own slice, so the doughnut sums to the
     whole account rather than to the invested portion only */
  const allocation = useMemo(() => {
    const slices = [...ROWS]
      .sort((a, b) => b.value - a.value)
      .map((r) => ({
        label: r.sym,
        value: r.value,
        pct: (r.value / NET_WORTH) * 100,
        color: COIN_COLORS[r.key],
      }));

    return [
      ...slices,
      {
        label: "Cash",
        value: CASH,
        pct: (CASH / NET_WORTH) * 100,
        color: "#6b7280",
      },
    ];
  }, []);

  const best = useMemo(
    () => [...ROWS].sort((a, b) => b.pnlPct - a.pnlPct).slice(0, 3),
    [],
  );
  const worst = useMemo(
    () => [...ROWS].sort((a, b) => a.pnlPct - b.pnlPct).slice(0, 3),
    [],
  );

  const lineData = {
    labels: curveLabels,
    datasets: [
      {
        data: curve,
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
          gradient.addColorStop(0, `rgba(${chart.accentRgb}, 0.3)`);
          gradient.addColorStop(0.7, `rgba(${chart.accentRgb}, 0.05)`);
          gradient.addColorStop(1, `rgba(${chart.accentRgb}, 0)`);
          return gradient;
        },
      },
    ],
  };

  const lineOptions = {
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
        displayColors: false,
        callbacks: { label: (item) => `$${money(item.parsed.y, 0)}` },
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

  const doughnutData = {
    labels: allocation.map((a) => a.label),
    datasets: [
      {
        data: allocation.map((a) => a.pct),
        backgroundColor: allocation.map((a) => a.color),
        borderWidth: 0,
        spacing: 3,
        hoverOffset: 6,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "72%",
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: chart.tooltipBg,
        titleColor: chart.tooltipTitle,
        bodyColor: chart.tooltipBody,
        borderColor: chart.tooltipBorder,
        borderWidth: 1,
        padding: 9,
        displayColors: false,
        callbacks: { label: (item) => `${item.parsed.toFixed(1)}%` },
      },
    },
  };

  const metrics = [
    {
      key: "worth",
      icon: Briefcase,
      label: "Net Worth",
      value: `$${money(NET_WORTH)}`,
      sub: `${ROWS.length} assets + cash`,
      tone: "neutral",
    },
    {
      key: "pnl",
      icon: TOTAL_PNL >= 0 ? TrendingUp : TrendingDown,
      label: "Total P&L",
      value: signed(TOTAL_PNL),
      sub: `${((TOTAL_PNL / COST_BASIS) * 100).toFixed(2)}% on cost`,
      tone: TOTAL_PNL >= 0 ? "up" : "down",
    },
    {
      key: "day",
      icon: CHANGE_24 >= 0 ? TrendingUp : TrendingDown,
      label: "24h Change",
      value: signed(CHANGE_24),
      sub: `${((CHANGE_24 / PREV_VALUE) * 100).toFixed(2)}% today`,
      tone: CHANGE_24 >= 0 ? "up" : "down",
    },
    {
      key: "cash",
      icon: Wallet,
      label: "Available Cash",
      value: `$${money(CASH)}`,
      sub: `${((CASH / NET_WORTH) * 100).toFixed(1)}% of portfolio`,
      tone: "neutral",
    },
  ];

  return (
    <section className="pf-page">
      {/* ============================ HEADER =========================== */}
      <header className="pf-header">
        <div className="pf-heading">
          <span className="pf-heading-icon">
            <Briefcase size={19} />
          </span>
          <div>
            <h1 className="pf-title">My Portfolio</h1>
            <p className="pf-subtitle">
              Holdings, allocation and performance across every asset you own.
            </p>
          </div>
        </div>

        <div className="pf-header-actions">
          <button type="button" className="pf-btn pf-btn--ghost">
            <Download size={14} /> Export
          </button>
        </div>
      </header>

      {/* ============================ METRICS ========================== */}
      <div className="pf-metrics">
        {metrics.map(({ key, icon: Icon, label, value, sub, tone }) => (
          <div className={`pf-card pf-metric is-${tone}`} key={key}>
            <span className="pf-metric-icon">
              <Icon size={16} />
            </span>
            <div className="pf-metric-body">
              <span className="pf-metric-label">{label}</span>
              <strong className="pf-metric-value">{value}</strong>
              <span className="pf-metric-sub">{sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ============================= GRID ============================ */}
      <div className="pf-grid">
        <div className="pf-col-main">
          {/* ------------------------ EQUITY CURVE ------------------- */}
          <div className="pf-card">
            <div className="pf-chart-head">
              <div className="pf-chart-title">
                <h2 className="pf-card-title">Portfolio Value</h2>
                <div className="pf-chart-figure">
                  <strong>${money(NET_WORTH)}</strong>
                  <Delta value={curveChangePct} />
                  <span className="pf-muted">
                    {signed(curveChange, 0)} over {range}
                  </span>
                </div>
              </div>

              <div className="pf-range" role="group" aria-label="Chart range">
                {RANGES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={range === r ? "is-active" : ""}
                    onClick={() => setRange(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="pf-chart-body">
              <Line data={lineData} options={lineOptions} />
            </div>
          </div>

          {/* -------------------------- HOLDINGS --------------------- */}
          <div className="pf-card">
            <div className="pf-toolbar">
              <div className="pf-tabs" role="tablist" aria-label="Filter holdings">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === t.id}
                    className={`pf-tab ${tab === t.id ? "is-active" : ""}`}
                    onClick={() => setTab(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="pf-tools">
                <label className="pf-sort">
                  <ArrowUpDown size={13} />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    aria-label="Sort holdings by"
                  >
                    {SORTS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="pf-search">
                  <Search size={14} />
                  <input
                    type="search"
                    value={query}
                    placeholder="Search asset..."
                    aria-label="Search holdings"
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="pf-table-scroll">
              <table className="pf-table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th className="pf-num">Price</th>
                    <th className="pf-num">24h</th>
                    <th className="pf-num">Holdings</th>
                    <th className="pf-num">Avg. Buy</th>
                    <th className="pf-num">Value</th>
                    <th>Allocation</th>
                    <th className="pf-num">Profit &amp; Loss</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.sym}>
                      <td data-label="Asset" className="pf-cell-asset">
                        <CoinMark coinKey={row.key} sym={row.sym} />
                        <span className="pf-asset-text">
                          <b>{row.sym}</b>
                          <small>{row.name}</small>
                        </span>
                      </td>
                      <td data-label="Price" className="pf-num pf-strong">
                        ${price(row.price)}
                      </td>
                      <td data-label="24h" className="pf-num">
                        <Delta value={row.change24} />
                      </td>
                      <td data-label="Holdings" className="pf-num">
                        <span className="pf-stacked">
                          <b>{qtyFmt(row.qty)}</b>
                          <small>{row.sym}</small>
                        </span>
                      </td>
                      <td data-label="Avg. Buy" className="pf-num pf-muted">
                        ${price(row.avg)}
                      </td>
                      <td data-label="Value" className="pf-num pf-strong">
                        ${money(row.value)}
                      </td>
                      <td data-label="Allocation">
                        <span className="pf-alloc-cell">
                          <span className="pf-alloc-track">
                            <i
                              style={{
                                width: `${Math.max(3, (row.value / NET_WORTH) * 100)}%`,
                                backgroundColor: COIN_COLORS[row.key],
                              }}
                            />
                          </span>
                          <small>
                            {((row.value / NET_WORTH) * 100).toFixed(1)}%
                          </small>
                        </span>
                      </td>
                      <td data-label="Profit & Loss" className="pf-num">
                        <span
                          className={`pf-pnl ${row.pnl >= 0 ? "is-up" : "is-down"}`}
                        >
                          <b>{signed(row.pnl)}</b>
                          <small>
                            {row.pnlPct >= 0 ? "+" : ""}
                            {row.pnlPct.toFixed(2)}%
                          </small>
                        </span>
                      </td>
                    </tr>
                  ))}

                  {rows.length === 0 && (
                    <tr className="pf-empty-row">
                      <td colSpan={8}>
                        <div className="pf-empty">
                          <Coins size={20} />
                          <p>No holdings match this filter.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* -------------------------- SIDE RAIL ----------------------- */}
        <aside className="pf-side">
          <div className="pf-card">
            <h2 className="pf-card-title">Allocation</h2>

            <div className="pf-alloc">
              <div className="pf-donut">
                <Doughnut data={doughnutData} options={doughnutOptions} />
                <div className="pf-donut-center">
                  <strong>${money(NET_WORTH, 0)}</strong>
                  <span>Net Worth</span>
                </div>
              </div>

              <ul className="pf-legend">
                {allocation.map((slice) => (
                  <li key={slice.label}>
                    <i style={{ backgroundColor: slice.color }} />
                    <span>{slice.label}</span>
                    <b>{slice.pct.toFixed(1)}%</b>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pf-card">
            <h2 className="pf-card-title">
              <Award size={14} /> Best &amp; Worst
            </h2>

            <div className="pf-movers">
              <span className="pf-movers-label pf-up">Top performers</span>
              <ul className="pf-mover-list">
                {best.map((row) => (
                  <li key={row.sym}>
                    <CoinMark coinKey={row.key} sym={row.sym} size="sm" />
                    <span className="pf-mover-name">{row.sym}</span>
                    <b className="pf-up">+{row.pnlPct.toFixed(2)}%</b>
                  </li>
                ))}
              </ul>

              <span className="pf-movers-label pf-down">Underperformers</span>
              <ul className="pf-mover-list">
                {worst.map((row) => (
                  <li key={row.sym}>
                    <CoinMark coinKey={row.key} sym={row.sym} size="sm" />
                    <span className="pf-mover-name">{row.sym}</span>
                    <b className={row.pnlPct >= 0 ? "pf-up" : "pf-down"}>
                      {row.pnlPct >= 0 ? "+" : ""}
                      {row.pnlPct.toFixed(2)}%
                    </b>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pf-card">
            <h2 className="pf-card-title">
              <Percent size={14} /> Account Summary
            </h2>

            <dl className="pf-summary">
              <div>
                <dt>Invested Value</dt>
                <dd>${money(INVESTED)}</dd>
              </div>
              <div>
                <dt>Cost Basis</dt>
                <dd>${money(COST_BASIS)}</dd>
              </div>
              <div>
                <dt>Unrealised P&amp;L</dt>
                <dd className={TOTAL_PNL >= 0 ? "pf-up" : "pf-down"}>
                  {signed(TOTAL_PNL)}
                </dd>
              </div>
              <div>
                <dt>Assets in Profit</dt>
                <dd className="pf-up">
                  {ROWS.filter((r) => r.pnl >= 0).length} / {ROWS.length}
                </dd>
              </div>
              <div>
                <dt>Largest Holding</dt>
                <dd>
                  {
                    [...ROWS].sort((a, b) => b.value - a.value)[0].sym
                  }
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default Portfolio;
