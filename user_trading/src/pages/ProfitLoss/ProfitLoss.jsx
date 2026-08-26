import { useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip as ChartTooltip,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Search,
  ArrowUpDown,
  Download,
  Trophy,
  Scale,
  Percent,
  Receipt,
  Coins,
} from "lucide-react";
import "./ProfitLoss.css";
import useChartTheme from "../../utils/chartTheme";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, ChartTooltip);

/* ================================================================== data ===
   Only the raw facts of each closed trade are stored - side, quantity, the
   price it was entered and exited at. Everything a trader reads (gross P&L,
   fees, net, ROI, win or loss) is DERIVED below, so a row can never show a
   profit that disagrees with its own entry and exit. */

const FEE_RATE = 0.001;

const TRADES = [
  { id: "t1",  pair: "BTC / USDT",  sym: "B", key: "btc",  side: "Long",  qty: 0.42,  entry: 61240.5, exit: 66980.0, date: "2025-08-12", held: "3d 04h" },
  { id: "t2",  pair: "ETH / USDT",  sym: "E", key: "eth",  side: "Long",  qty: 4.8,   entry: 3288.4,  exit: 3588.9,  date: "2025-08-11", held: "1d 18h" },
  { id: "t3",  pair: "SOL / USDT",  sym: "S", key: "sol",  side: "Short", qty: 96,    entry: 152.4,   exit: 138.72,  date: "2025-08-11", held: "9h 22m" },
  { id: "t4",  pair: "XRP / USDT",  sym: "X", key: "xrp",  side: "Long",  qty: 12000, entry: 0.6488,  exit: 0.5987,  date: "2025-08-10", held: "5d 02h" },
  { id: "t5",  pair: "BNB / USDT",  sym: "B", key: "bnb",  side: "Long",  qty: 12.5,  entry: 588.1,   exit: 618.4,   date: "2025-08-10", held: "2d 11h" },
  { id: "t6",  pair: "AVAX / USDT", sym: "A", key: "avax", side: "Short", qty: 180,   entry: 33.18,   exit: 35.42,   date: "2025-08-09", held: "14h 08m" },
  { id: "t7",  pair: "LINK / USDT", sym: "L", key: "link", side: "Long",  qty: 300,   entry: 13.05,   exit: 16.25,   date: "2025-08-09", held: "6d 20h" },
  { id: "t8",  pair: "ADA / USDT",  sym: "A", key: "ada",  side: "Long",  qty: 8600,  entry: 0.5124,  exit: 0.4712,  date: "2025-08-08", held: "4d 06h" },
  { id: "t9",  pair: "DOGE / USDT", sym: "D", key: "doge", side: "Long",  qty: 42000, entry: 0.1188,  exit: 0.1234,  date: "2025-08-08", held: "1d 03h" },
  { id: "t10", pair: "DOT / USDT",  sym: "D", key: "dot",  side: "Short", qty: 420,   entry: 7.42,    exit: 7.08,    date: "2025-08-07", held: "22h 41m" },
  { id: "t11", pair: "BTC / USDT",  sym: "B", key: "btc",  side: "Short", qty: 0.18,  entry: 64100.0, exit: 65380.0, date: "2025-08-07", held: "7h 15m" },
  { id: "t12", pair: "ETH / USDT",  sym: "E", key: "eth",  side: "Long",  qty: 2.4,   entry: 3402.15, exit: 3312.6,  date: "2025-08-06", held: "1d 09h" },
];

/* Asset-brand colours: these identify a coin, not a surface, so they are
   deliberately literal and stay fixed in both themes. */
const COIN_COLORS = {
  btc: "#f7931a",
  eth: "#627eea",
  sol: "#14f195",
  xrp: "#5c6773",
  bnb: "#f3ba2f",
  avax: "#e84142",
  link: "#2a5ada",
  ada: "#0033ad",
  doge: "#c2a633",
  dot: "#e6007a",
};

/* Open positions still running. Their P&L is unrealised, so it is kept apart
   from the realised total and only combined in the "Net" metric. */
const UNREALISED = 14552.31;

const PERIODS = ["7D", "30D", "90D", "1Y"];

const TABS = [
  { id: "all", label: "All Trades" },
  { id: "win", label: "Wins" },
  { id: "loss", label: "Losses" },
];

const SORTS = [
  { id: "recent", label: "Most Recent" },
  { id: "pnl", label: "Largest Profit" },
  { id: "loss", label: "Largest Loss" },
  { id: "roi", label: "Best Return %" },
];

/* ============================================================== derived ===*/

const derive = (trade) => {
  const { side, qty, entry, exit } = trade;
  const cost = entry * qty;
  const proceeds = exit * qty;
  // Long profits when the exit is higher, short when it is lower
  const gross = side === "Long" ? proceeds - cost : cost - proceeds;
  // Charged on both legs
  const fees = (cost + proceeds) * FEE_RATE;
  const net = gross - fees;
  const roi = cost > 0 ? (net / cost) * 100 : 0;

  return { ...trade, cost, proceeds, gross, fees, net, roi, win: net > 0 };
};

const ROWS = TRADES.map(derive);

const REALISED = ROWS.reduce((sum, r) => sum + r.net, 0);
const TOTAL_FEES = ROWS.reduce((sum, r) => sum + r.fees, 0);
const WINS = ROWS.filter((r) => r.win);
const LOSSES = ROWS.filter((r) => !r.win);
const GROSS_PROFIT = WINS.reduce((sum, r) => sum + r.net, 0);
const GROSS_LOSS = Math.abs(LOSSES.reduce((sum, r) => sum + r.net, 0));

/* Daily totals, oldest first, for the bar chart */
const BY_DAY = (() => {
  const groups = new Map();
  for (const row of ROWS) {
    groups.set(row.date, (groups.get(row.date) || 0) + row.net);
  }
  return [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, net]) => ({ date, net }));
})();

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

const shortDate = (iso) => {
  const [, month, day] = iso.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${day} ${months[Number(month) - 1]}`;
};

/* ============================================================ components ===*/

const CoinMark = ({ coinKey, sym, size }) => (
  <span
    className={`pl-coin${size ? ` pl-coin--${size}` : ""}`}
    style={{ backgroundColor: COIN_COLORS[coinKey] || "#6b7280" }}
    aria-hidden="true"
  >
    {sym}
  </span>
);

/* ============================================================= component ===*/

const ProfitLoss = () => {
  const [period, setPeriod] = useState("30D");
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");

  const chart = useChartTheme();

  const stats = useMemo(() => {
    const winRate = ROWS.length > 0 ? (WINS.length / ROWS.length) * 100 : 0;
    return {
      realised: REALISED,
      unrealised: UNREALISED,
      net: REALISED + UNREALISED,
      fees: TOTAL_FEES,
      winRate,
      wins: WINS.length,
      losses: LOSSES.length,
      avgWin: WINS.length > 0 ? GROSS_PROFIT / WINS.length : 0,
      avgLoss: LOSSES.length > 0 ? GROSS_LOSS / LOSSES.length : 0,
      // Gross profit divided by gross loss: above 1 means the wins outweigh
      // the losses. Infinity when there are no losses at all.
      profitFactor: GROSS_LOSS > 0 ? GROSS_PROFIT / GROSS_LOSS : Infinity,
      best: [...ROWS].sort((a, b) => b.net - a.net)[0],
      worst: [...ROWS].sort((a, b) => a.net - b.net)[0],
    };
  }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();

    return ROWS.filter((r) => {
      if (q && !r.pair.toLowerCase().includes(q)) return false;
      if (tab === "win") return r.win;
      if (tab === "loss") return !r.win;
      return true;
    }).sort((a, b) => {
      if (sortBy === "pnl") return b.net - a.net;
      if (sortBy === "loss") return a.net - b.net;
      if (sortBy === "roi") return b.roi - a.roi;
      return b.date.localeCompare(a.date) || b.id.localeCompare(a.id);
    });
  }, [tab, query, sortBy]);

  /* Cumulative running total, so the chart shows the equity path as well as
     the daily bars */
  const cumulative = useMemo(() => {
    let running = 0;
    return BY_DAY.map((d) => {
      running += d.net;
      return running;
    });
  }, []);

  const barData = {
    labels: BY_DAY.map((d) => shortDate(d.date)),
    datasets: [
      {
        data: BY_DAY.map((d) => d.net),
        backgroundColor: BY_DAY.map((d) => (d.net >= 0 ? chart.up : chart.down)),
        borderRadius: 4,
        borderSkipped: false,
        // Bars stay readable rather than becoming thick blocks on wide screens
        maxBarThickness: 34,
      },
    ],
  };

  const barOptions = {
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
        callbacks: { label: (item) => signed(item.parsed.y) },
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
          callback: (value) =>
            `${value < 0 ? "-" : ""}$${Math.abs(value / 1000).toFixed(1)}k`,
        },
      },
    },
  };

  const doughnutData = {
    labels: ["Wins", "Losses"],
    datasets: [
      {
        data: [stats.wins, stats.losses],
        backgroundColor: [chart.up, chart.down],
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
        callbacks: {
          label: (item) => `${item.parsed} trade${item.parsed === 1 ? "" : "s"}`,
        },
      },
    },
  };

  const metrics = [
    {
      key: "realised",
      icon: stats.realised >= 0 ? TrendingUp : TrendingDown,
      label: "Realised P&L",
      value: signed(stats.realised),
      sub: `${ROWS.length} closed trades`,
      tone: stats.realised >= 0 ? "up" : "down",
    },
    {
      key: "unrealised",
      icon: Coins,
      label: "Unrealised P&L",
      value: signed(stats.unrealised),
      sub: "Open positions",
      tone: stats.unrealised >= 0 ? "up" : "down",
    },
    {
      key: "net",
      icon: Scale,
      label: "Net P&L",
      value: signed(stats.net),
      sub: "Realised + unrealised",
      tone: stats.net >= 0 ? "up" : "down",
    },
    {
      key: "rate",
      icon: Trophy,
      label: "Win Rate",
      value: `${stats.winRate.toFixed(1)}%`,
      sub: `${stats.wins}W / ${stats.losses}L`,
      tone: stats.winRate >= 50 ? "up" : "down",
    },
  ];

  return (
    <section className="pl-page">
      {/* ============================ HEADER =========================== */}
      <header className="pl-header">
        <div className="pl-heading">
          <span className="pl-heading-icon">
            <BarChart3 size={19} />
          </span>
          <div>
            <h1 className="pl-title">Profit &amp; Loss</h1>
            <p className="pl-subtitle">
              Realised results trade by trade, with fees, win rate and the
              statistics behind them.
            </p>
          </div>
        </div>

        <div className="pl-header-actions">
          <div className="pl-period" role="group" aria-label="Reporting period">
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
          <button type="button" className="pl-btn pl-btn--ghost">
            <Download size={14} /> Export
          </button>
        </div>
      </header>

      {/* ============================ METRICS ========================== */}
      <div className="pl-metrics">
        {metrics.map(({ key, icon: Icon, label, value, sub, tone }) => (
          <div className={`pl-card pl-metric is-${tone}`} key={key}>
            <span className="pl-metric-icon">
              <Icon size={16} />
            </span>
            <div className="pl-metric-body">
              <span className="pl-metric-label">{label}</span>
              <strong className="pl-metric-value">{value}</strong>
              <span className="pl-metric-sub">{sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ============================= GRID ============================ */}
      <div className="pl-grid">
        <div className="pl-col-main">
          {/* -------------------------- DAILY P&L -------------------- */}
          <div className="pl-card">
            <div className="pl-chart-head">
              <div>
                <h2 className="pl-card-title">Daily Profit &amp; Loss</h2>
                <div className="pl-chart-figure">
                  <strong className={REALISED >= 0 ? "pl-up" : "pl-down"}>
                    {signed(REALISED)}
                  </strong>
                  <span className="pl-muted">
                    realised over {BY_DAY.length} trading days
                  </span>
                </div>
              </div>

              <div className="pl-cum">
                <span className="pl-muted">Cumulative</span>
                <b className={cumulative[cumulative.length - 1] >= 0 ? "pl-up" : "pl-down"}>
                  {signed(cumulative[cumulative.length - 1])}
                </b>
              </div>
            </div>

            <div className="pl-chart-body">
              <Bar data={barData} options={barOptions} />
            </div>
          </div>

          {/* ------------------------ CLOSED TRADES ------------------ */}
          <div className="pl-card">
            <div className="pl-toolbar">
              <div className="pl-tabs" role="tablist" aria-label="Filter trades">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === t.id}
                    className={`pl-tab ${tab === t.id ? "is-active" : ""}`}
                    onClick={() => setTab(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="pl-tools">
                <label className="pl-sort">
                  <ArrowUpDown size={13} />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    aria-label="Sort trades by"
                  >
                    {SORTS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="pl-search">
                  <Search size={14} />
                  <input
                    type="search"
                    value={query}
                    placeholder="Search pair..."
                    aria-label="Search closed trades"
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="pl-table-scroll">
              <table className="pl-table">
                <thead>
                  <tr>
                    <th>Closed</th>
                    <th>Pair</th>
                    <th>Side</th>
                    <th className="pl-num">Quantity</th>
                    <th className="pl-num">Entry</th>
                    <th className="pl-num">Exit</th>
                    <th className="pl-num">Fees</th>
                    <th className="pl-num">Realised P&amp;L</th>
                    <th className="pl-num">ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className={row.win ? "is-win" : "is-loss"}>
                      <td data-label="Closed" className="pl-cell-date">
                        <b>{shortDate(row.date)}</b>
                        <small>{row.held}</small>
                      </td>
                      <td data-label="Pair" className="pl-cell-pair">
                        <CoinMark coinKey={row.key} sym={row.sym} />
                        <b>{row.pair}</b>
                      </td>
                      <td data-label="Side">
                        <span
                          className={`pl-side ${row.side === "Long" ? "is-long" : "is-short"}`}
                        >
                          {row.side}
                        </span>
                      </td>
                      <td data-label="Quantity" className="pl-num">
                        {qtyFmt(row.qty)}
                      </td>
                      <td data-label="Entry" className="pl-num">
                        ${price(row.entry)}
                      </td>
                      <td data-label="Exit" className="pl-num pl-strong">
                        ${price(row.exit)}
                      </td>
                      <td data-label="Fees" className="pl-num pl-muted">
                        ${money(row.fees)}
                      </td>
                      <td data-label="Realised P&L" className="pl-num">
                        <b className={row.win ? "pl-up" : "pl-down"}>
                          {signed(row.net)}
                        </b>
                      </td>
                      <td data-label="ROI" className="pl-num">
                        <span
                          className={`pl-roi ${row.win ? "is-up" : "is-down"}`}
                        >
                          {row.roi >= 0 ? "+" : ""}
                          {row.roi.toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  ))}

                  {rows.length === 0 && (
                    <tr className="pl-empty-row">
                      <td colSpan={9}>
                        <div className="pl-empty">
                          <BarChart3 size={20} />
                          <p>No trades match this filter.</p>
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
        <aside className="pl-side">
          <div className="pl-card">
            <h2 className="pl-card-title">Win Rate</h2>

            <div className="pl-alloc">
              <div className="pl-donut">
                <Doughnut data={doughnutData} options={doughnutOptions} />
                <div className="pl-donut-center">
                  <strong>{stats.winRate.toFixed(0)}%</strong>
                  <span>Win rate</span>
                </div>
              </div>

              <ul className="pl-legend">
                <li>
                  <i className="pl-dot-up" />
                  <span>Wins</span>
                  <b>{stats.wins}</b>
                </li>
                <li>
                  <i className="pl-dot-down" />
                  <span>Losses</span>
                  <b>{stats.losses}</b>
                </li>
              </ul>
            </div>
          </div>

          <div className="pl-card">
            <h2 className="pl-card-title">
              <Trophy size={14} /> Best &amp; Worst
            </h2>

            <div className="pl-extremes">
              <div className="pl-extreme is-up">
                <CoinMark coinKey={stats.best.key} sym={stats.best.sym} size="sm" />
                <span className="pl-extreme-body">
                  <b>{stats.best.pair}</b>
                  <small>Best trade · {shortDate(stats.best.date)}</small>
                </span>
                <b className="pl-up">{signed(stats.best.net, 0)}</b>
              </div>

              <div className="pl-extreme is-down">
                <CoinMark
                  coinKey={stats.worst.key}
                  sym={stats.worst.sym}
                  size="sm"
                />
                <span className="pl-extreme-body">
                  <b>{stats.worst.pair}</b>
                  <small>Worst trade · {shortDate(stats.worst.date)}</small>
                </span>
                <b className="pl-down">{signed(stats.worst.net, 0)}</b>
              </div>
            </div>
          </div>

          <div className="pl-card">
            <h2 className="pl-card-title">
              <Percent size={14} /> Trade Statistics
            </h2>

            <dl className="pl-stats">
              <div>
                <dt>Profit Factor</dt>
                <dd className={stats.profitFactor >= 1 ? "pl-up" : "pl-down"}>
                  {Number.isFinite(stats.profitFactor)
                    ? stats.profitFactor.toFixed(2)
                    : "∞"}
                </dd>
              </div>
              <div>
                <dt>Average Win</dt>
                <dd className="pl-up">{signed(stats.avgWin, 0)}</dd>
              </div>
              <div>
                <dt>Average Loss</dt>
                <dd className="pl-down">{signed(-stats.avgLoss, 0)}</dd>
              </div>
              <div>
                <dt>
                  <Receipt size={11} /> Total Fees
                </dt>
                <dd>${money(stats.fees)}</dd>
              </div>
              <div>
                <dt>Gross Profit</dt>
                <dd className="pl-up">{signed(GROSS_PROFIT, 0)}</dd>
              </div>
              <div>
                <dt>Gross Loss</dt>
                <dd className="pl-down">{signed(-GROSS_LOSS, 0)}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default ProfitLoss;
