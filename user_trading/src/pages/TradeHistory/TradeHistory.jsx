import { useMemo, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import {
  CandlestickChart,
  Search,
  ArrowUpDown,
  Download,
  ChevronLeft,
  ChevronRight,
  Percent,
  Zap,
  Layers,
  Scale,
  Receipt,
} from "lucide-react";
import "./TradeHistory.css";
import useChartTheme from "../../utils/chartTheme";

ChartJS.register(ArcElement, ChartTooltip);

/* ================================================================== data ===
   Each row is a single FILL, not an order - one order can appear here several
   times if it filled in pieces (see order 8470884 below). Only the raw facts
   are stored: side, role, price and quantity. The trade value and the fee are
   DERIVED, so a row can never show a fee that disagrees with its own size or
   with the maker/taker rate it was charged at. */

/* Makers add liquidity to the book and are charged less than takers, who
   remove it. Both rates feed the fee column and the effective-rate stat. */
const FEE_RATES = { Maker: 0.0002, Taker: 0.0005 };

const FILLS = [
  { id: "F901244", order: "8471023", pair: "BTC / USDT",  sym: "B", key: "btc",  side: "Buy",  role: "Taker", price: 65120.4, qty: 0.485,  date: "2025-08-12", time: "09:41:22" },
  { id: "F901231", order: "8470884", pair: "ETH / USDT",  sym: "E", key: "eth",  side: "Buy",  role: "Maker", price: 3402.15, qty: 4.0,    date: "2025-08-12", time: "08:12:04" },
  { id: "F901230", order: "8470884", pair: "ETH / USDT",  sym: "E", key: "eth",  side: "Buy",  role: "Maker", price: 3402.4,  qty: 2.24,   date: "2025-08-12", time: "08:11:57" },
  { id: "F901188", order: "8470612", pair: "SOL / USDT",  sym: "S", key: "sol",  side: "Sell", role: "Taker", price: 152.4,   qty: 96,     date: "2025-08-11", time: "18:22:31" },
  { id: "F901154", order: "8470118", pair: "XRP / USDT",  sym: "X", key: "xrp",  side: "Buy",  role: "Maker", price: 0.6212,  qty: 18400,  date: "2025-08-11", time: "14:05:47" },
  { id: "F901120", order: "8469950", pair: "BNB / USDT",  sym: "B", key: "bnb",  side: "Sell", role: "Taker", price: 618.4,   qty: 8.5,    date: "2025-08-11", time: "12:47:10" },
  { id: "F901098", order: "8469744", pair: "AVAX / USDT", sym: "A", key: "avax", side: "Buy",  role: "Maker", price: 33.18,   qty: 210,    date: "2025-08-11", time: "10:44:58" },
  { id: "F901077", order: "8469501", pair: "LINK / USDT", sym: "L", key: "link", side: "Buy",  role: "Taker", price: 15.92,   qty: 320,    date: "2025-08-10", time: "21:38:15" },
  { id: "F901052", order: "8469320", pair: "ADA / USDT",  sym: "A", key: "ada",  side: "Sell", role: "Maker", price: 0.4712,  qty: 9800,   date: "2025-08-10", time: "18:08:39" },
  { id: "F901031", order: "8469104", pair: "DOGE / USDT", sym: "D", key: "doge", side: "Buy",  role: "Taker", price: 0.1188,  qty: 42000,  date: "2025-08-10", time: "14:22:07" },
  { id: "F901010", order: "8468877", pair: "BTC / USDT",  sym: "B", key: "btc",  side: "Sell", role: "Maker", price: 66980.0, qty: 0.22,   date: "2025-08-09", time: "20:57:12" },
  { id: "F900988", order: "8468412", pair: "ETH / USDT",  sym: "E", key: "eth",  side: "Sell", role: "Taker", price: 3588.9,  qty: 3.1,    date: "2025-08-09", time: "16:41:03" },
  { id: "F900961", order: "8468190", pair: "SOL / USDT",  sym: "S", key: "sol",  side: "Buy",  role: "Maker", price: 138.72,  qty: 64,     date: "2025-08-09", time: "11:29:55" },
  { id: "F900934", order: "8467955", pair: "DOT / USDT",  sym: "D", key: "dot",  side: "Sell", role: "Taker", price: 7.42,    qty: 168,    date: "2025-08-08", time: "22:06:21" },
  { id: "F900907", order: "8467701", pair: "BTC / USDT",  sym: "B", key: "btc",  side: "Buy",  role: "Maker", price: 64100.0, qty: 0.18,   date: "2025-08-08", time: "15:14:36" },
  { id: "F900880", order: "8467488", pair: "BNB / USDT",  sym: "B", key: "bnb",  side: "Buy",  role: "Taker", price: 588.1,   qty: 9.4,    date: "2025-08-08", time: "09:50:08" },
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

const ROLE_COLORS = {
  Maker: { hex: "#00c281", rgb: "0, 194, 129" },
  Taker: { hex: "#3b82f6", rgb: "59, 130, 246" },
};

const TABS = [
  { id: "all", label: "All Fills" },
  { id: "Buy", label: "Buys" },
  { id: "Sell", label: "Sells" },
  { id: "Maker", label: "Maker" },
  { id: "Taker", label: "Taker" },
];

const SORTS = [
  { id: "recent", label: "Most Recent" },
  { id: "oldest", label: "Oldest First" },
  { id: "value", label: "Largest Trade" },
  { id: "fee", label: "Highest Fee" },
];

const PAGE_SIZES = [8, 12, 16];

/* ============================================================== derived ===*/

const derive = (fill) => {
  const value = fill.price * fill.qty;
  const rate = FEE_RATES[fill.role];
  const fee = value * rate;

  return {
    ...fill,
    value,
    rate,
    fee,
    stamp: `${fill.date} ${fill.time}`,
  };
};

const ROWS = FILLS.map(derive);

const VOLUME = ROWS.reduce((sum, r) => sum + r.value, 0);
const FEES = ROWS.reduce((sum, r) => sum + r.fee, 0);
const MAKERS = ROWS.filter((r) => r.role === "Maker");
const TAKERS = ROWS.filter((r) => r.role === "Taker");
/* What the account actually paid across everything, which sits between the
   two published rates and is the number a trader watches */
const EFFECTIVE_RATE = VOLUME > 0 ? (FEES / VOLUME) * 100 : 0;

/* =============================================================== format ===*/

const money = (value, dp = 2) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });

/* Sub-dollar assets need significant digits, not two decimals: $0.6212 must
   not round away to $0.62 */
const price = (value) => (value >= 1 ? money(value) : value.toPrecision(4));

const qtyFmt = (value) => money(value, value < 10 ? 4 : value < 1000 ? 2 : 0);

/* Fees are small; two decimals would render most of them as $0.00 */
const feeFmt = (value) => money(value, value < 1 ? 4 : 2);

const shortDate = (iso) => {
  const [, month, day] = iso.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${day} ${months[Number(month) - 1]}`;
};

/* ============================================================ components ===*/

const CoinMark = ({ coinKey, sym, size }) => (
  <span
    className={`th-coin${size ? ` th-coin--${size}` : ""}`}
    style={{ backgroundColor: COIN_COLORS[coinKey] || "#6b7280" }}
    aria-hidden="true"
  >
    {sym}
  </span>
);

/* ============================================================= component ===*/

const TradeHistory = () => {
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const chart = useChartTheme();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return ROWS.filter((r) => {
      if (q && !`${r.pair} ${r.id} ${r.order}`.toLowerCase().includes(q)) {
        return false;
      }
      if (tab === "Buy" || tab === "Sell") return r.side === tab;
      if (tab === "Maker" || tab === "Taker") return r.role === tab;
      return true;
    }).sort((a, b) => {
      if (sortBy === "oldest") return a.stamp.localeCompare(b.stamp);
      if (sortBy === "value") return b.value - a.value;
      if (sortBy === "fee") return b.fee - a.fee;
      return b.stamp.localeCompare(a.stamp);
    });
  }, [tab, query, sortBy]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  /* Filtering can shrink the list below the current page; clamp rather than
     render an empty table until the user notices */
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * pageSize;
  const rows = filtered.slice(start, start + pageSize);

  const resetTo = (updater) => {
    updater();
    setPage(1);
  };

  /* Volume per pair, biggest first */
  const byPair = useMemo(() => {
    const groups = new Map();
    for (const row of ROWS) {
      const prev = groups.get(row.pair) || { value: 0, key: row.key, sym: row.sym };
      groups.set(row.pair, { ...prev, value: prev.value + row.value });
    }
    const list = [...groups.entries()].map(([pair, v]) => ({ pair, ...v }));
    const peak = Math.max(...list.map((p) => p.value), 1);
    return list
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map((p) => ({ ...p, width: (p.value / peak) * 100 }));
  }, []);

  const doughnutData = {
    labels: ["Maker", "Taker"],
    datasets: [
      {
        data: [MAKERS.length, TAKERS.length],
        backgroundColor: [ROLE_COLORS.Maker.hex, ROLE_COLORS.Taker.hex],
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
          label: (item) => `${item.parsed} fill${item.parsed === 1 ? "" : "s"}`,
        },
      },
    },
  };

  const makerPct = ROWS.length > 0 ? (MAKERS.length / ROWS.length) * 100 : 0;

  const metrics = [
    {
      key: "fills",
      icon: CandlestickChart,
      label: "Total Fills",
      value: String(ROWS.length),
      sub: `across ${new Set(ROWS.map((r) => r.order)).size} orders`,
      tone: "neutral",
    },
    {
      key: "volume",
      icon: Scale,
      label: "Volume Traded",
      value: `$${money(VOLUME, 0)}`,
      sub: "Executed notional",
      tone: "neutral",
    },
    {
      key: "fees",
      icon: Receipt,
      label: "Fees Paid",
      value: `$${money(FEES)}`,
      sub: `${EFFECTIVE_RATE.toFixed(3)}% effective rate`,
      tone: "warn",
    },
    {
      key: "maker",
      icon: Layers,
      label: "Maker Ratio",
      value: `${makerPct.toFixed(0)}%`,
      sub: `${MAKERS.length} maker / ${TAKERS.length} taker`,
      tone: makerPct >= 50 ? "up" : "neutral",
    },
  ];

  return (
    <section className="th-page">
      {/* ============================ HEADER =========================== */}
      <header className="th-header">
        <div className="th-heading">
          <span className="th-heading-icon">
            <CandlestickChart size={19} />
          </span>
          <div>
            <h1 className="th-title">Trade History</h1>
            <p className="th-subtitle">
              Every individual fill, with the price it executed at and the fee
              it was charged. One order can appear more than once.
            </p>
          </div>
        </div>

        <div className="th-header-actions">
          <button type="button" className="th-btn th-btn--ghost">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </header>

      {/* ============================ METRICS ========================== */}
      <div className="th-metrics">
        {metrics.map(({ key, icon: Icon, label, value, sub, tone }) => (
          <div className={`th-card th-metric is-${tone}`} key={key}>
            <span className="th-metric-icon">
              <Icon size={16} />
            </span>
            <div className="th-metric-body">
              <span className="th-metric-label">{label}</span>
              <strong className="th-metric-value">{value}</strong>
              <span className="th-metric-sub">{sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ============================= GRID ============================ */}
      <div className="th-grid">
        {/* ---------------------------- FILLS ------------------------- */}
        <div className="th-card">
          <div className="th-toolbar">
            <div className="th-tabs" role="tablist" aria-label="Filter fills">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  className={`th-tab ${tab === t.id ? "is-active" : ""}`}
                  onClick={() => resetTo(() => setTab(t.id))}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="th-tools">
              <label className="th-sort">
                <ArrowUpDown size={13} />
                <select
                  value={sortBy}
                  onChange={(e) => resetTo(() => setSortBy(e.target.value))}
                  aria-label="Sort fills by"
                >
                  {SORTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="th-search">
                <Search size={14} />
                <input
                  type="search"
                  value={query}
                  placeholder="Search pair or order ID..."
                  aria-label="Search trade history"
                  onChange={(e) => resetTo(() => setQuery(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="th-table-scroll">
            <table className="th-table">
              <thead>
                <tr>
                  <th>Executed</th>
                  <th>Pair</th>
                  <th>Side</th>
                  <th>Role</th>
                  <th className="th-num">Price</th>
                  <th className="th-num">Quantity</th>
                  <th className="th-num">Total</th>
                  <th className="th-num">Fee</th>
                  <th className="th-num">Order</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td data-label="Executed" className="th-cell-date">
                      <b>{shortDate(row.date)}</b>
                      <small>{row.time}</small>
                    </td>
                    <td data-label="Pair" className="th-cell-pair">
                      <CoinMark coinKey={row.key} sym={row.sym} />
                      <b>{row.pair}</b>
                    </td>
                    <td data-label="Side">
                      <span
                        className={`th-side ${row.side === "Buy" ? "is-buy" : "is-sell"}`}
                      >
                        {row.side}
                      </span>
                    </td>
                    <td data-label="Role">
                      <span
                        className="th-role"
                        style={{ "--role-rgb": ROLE_COLORS[row.role].rgb }}
                      >
                        {row.role === "Maker" ? (
                          <Layers size={10} />
                        ) : (
                          <Zap size={10} />
                        )}
                        {row.role}
                      </span>
                    </td>
                    <td data-label="Price" className="th-num th-strong">
                      ${price(row.price)}
                    </td>
                    <td data-label="Quantity" className="th-num">
                      {qtyFmt(row.qty)}
                    </td>
                    <td data-label="Total" className="th-num th-strong">
                      ${money(row.value)}
                    </td>
                    <td data-label="Fee" className="th-num">
                      <span className="th-fee">
                        <b>${feeFmt(row.fee)}</b>
                        <small>{(row.rate * 100).toFixed(2)}%</small>
                      </span>
                    </td>
                    <td data-label="Order" className="th-num th-muted">
                      #{row.order}
                    </td>
                  </tr>
                ))}

                {rows.length === 0 && (
                  <tr className="th-empty-row">
                    <td colSpan={9}>
                      <div className="th-empty">
                        <CandlestickChart size={20} />
                        <p>No fills match this filter.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="th-table-foot">
            <span className="th-muted">
              {filtered.length === 0
                ? "No fills"
                : `Showing ${start + 1} to ${Math.min(start + pageSize, filtered.length)} of ${filtered.length} fills`}
            </span>

            <div className="th-pager">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                aria-label="Previous page"
              >
                <ChevronLeft size={15} />
              </button>

              {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  className={n === safePage ? "is-active" : ""}
                  onClick={() => setPage(n)}
                  aria-current={n === safePage ? "page" : undefined}
                >
                  {n}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={safePage === pageCount}
                aria-label="Next page"
              >
                <ChevronRight size={15} />
              </button>
            </div>

            <label className="th-rows">
              <span className="th-muted">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) =>
                  resetTo(() => setPageSize(Number(e.target.value)))
                }
                aria-label="Rows per page"
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* -------------------------- SIDE RAIL ----------------------- */}
        <aside className="th-side">
          <div className="th-card">
            <h2 className="th-card-title">Maker vs Taker</h2>

            <div className="th-alloc">
              <div className="th-donut">
                <Doughnut data={doughnutData} options={doughnutOptions} />
                <div className="th-donut-center">
                  <strong>{makerPct.toFixed(0)}%</strong>
                  <span>Maker</span>
                </div>
              </div>

              <ul className="th-legend">
                <li>
                  <i style={{ backgroundColor: ROLE_COLORS.Maker.hex }} />
                  <span>Maker</span>
                  <b>{MAKERS.length}</b>
                </li>
                <li>
                  <i style={{ backgroundColor: ROLE_COLORS.Taker.hex }} />
                  <span>Taker</span>
                  <b>{TAKERS.length}</b>
                </li>
              </ul>
            </div>

            <p className="th-note">
              Makers add liquidity and pay{" "}
              {(FEE_RATES.Maker * 100).toFixed(2)}%. Takers remove it and pay{" "}
              {(FEE_RATES.Taker * 100).toFixed(2)}%.
            </p>
          </div>

          <div className="th-card">
            <h2 className="th-card-title">Volume by Pair</h2>

            <ul className="th-top-list">
              {byPair.map((p) => (
                <li key={p.pair}>
                  <span className="th-top-pair">
                    <CoinMark coinKey={p.key} sym={p.sym} size="sm" />
                    {p.pair.split(" ")[0]}
                  </span>
                  <span className="th-top-bar">
                    <i style={{ width: `${Math.max(4, p.width)}%` }} />
                  </span>
                  <b>${money(p.value, 0)}</b>
                </li>
              ))}
            </ul>
          </div>

          <div className="th-card">
            <h2 className="th-card-title">
              <Percent size={14} /> Execution Stats
            </h2>

            <dl className="th-summary">
              <div>
                <dt>Avg. Trade Size</dt>
                <dd>${money(VOLUME / ROWS.length, 0)}</dd>
              </div>
              <div>
                <dt>Largest Fill</dt>
                <dd>
                  ${money(Math.max(...ROWS.map((r) => r.value)), 0)}
                </dd>
              </div>
              <div>
                <dt>Buy / Sell</dt>
                <dd>
                  {ROWS.filter((r) => r.side === "Buy").length} /{" "}
                  {ROWS.filter((r) => r.side === "Sell").length}
                </dd>
              </div>
              <div>
                <dt>Maker Fees</dt>
                <dd className="th-up">
                  ${money(MAKERS.reduce((s, r) => s + r.fee, 0))}
                </dd>
              </div>
              <div>
                <dt>Taker Fees</dt>
                <dd>${money(TAKERS.reduce((s, r) => s + r.fee, 0))}</dd>
              </div>
              <div>
                <dt>Effective Rate</dt>
                <dd className="th-warn">{EFFECTIVE_RATE.toFixed(3)}%</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default TradeHistory;
