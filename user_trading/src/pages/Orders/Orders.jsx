import { Fragment, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import {
  History,
  Search,
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  CheckCircle2,
  XCircle,
  Ban,
  Clock,
  Receipt,
  Percent,
  Hash,
  Calendar,
} from "lucide-react";
import "./Orders.css";
import useChartTheme from "../../utils/chartTheme";

ChartJS.register(ArcElement, ChartTooltip);

/* ================================================================== data ===
   Only the raw facts of each order are stored - price, amount, how much
   actually filled, and the outcome. Everything a trader reads (order value,
   fill percentage, fee, notional traded) is DERIVED below, so a row can never
   show a total that disagrees with its own price and filled amount. */

const FEE_RATE = 0.001;

const HISTORY = [
  { id: "8471023", pair: "BTC / USDT", sym: "B", key: "btc", side: "Buy",  type: "Limit",       price: 65120.4, amount: 0.485,  filled: 0.485,  status: "Filled",    date: "2025-08-12", time: "09:41:22" },
  { id: "8470884", pair: "ETH / USDT", sym: "E", key: "eth", side: "Buy",  type: "Market",      price: 3402.15, amount: 6.24,   filled: 6.24,   status: "Filled",    date: "2025-08-12", time: "08:12:04" },
  { id: "8470612", pair: "SOL / USDT", sym: "S", key: "sol", side: "Sell", type: "Limit",       price: 152.4,   amount: 128.5,  filled: 0,      status: "Cancelled", date: "2025-08-12", time: "07:55:31" },
  { id: "8470118", pair: "XRP / USDT", sym: "X", key: "xrp", side: "Buy",  type: "Limit",       price: 0.6212,  amount: 18400,  filled: 18400,  status: "Filled",    date: "2025-08-11", time: "22:18:47" },
  { id: "8469950", pair: "BNB / USDT", sym: "B", key: "bnb", side: "Sell", type: "Stop Limit",  price: 618.4,   amount: 14.2,   filled: 8.5,    status: "Partial",   date: "2025-08-11", time: "19:02:10" },
  { id: "8469744", pair: "AVAX / USDT",sym: "A", key: "avax",side: "Buy",  type: "Limit",       price: 33.18,   amount: 210,    filled: 210,    status: "Filled",    date: "2025-08-11", time: "16:44:58" },
  { id: "8469501", pair: "LINK / USDT",sym: "L", key: "link",side: "Buy",  type: "Limit",       price: 15.92,   amount: 320,    filled: 0,      status: "Expired",   date: "2025-08-11", time: "12:30:15" },
  { id: "8469320", pair: "ADA / USDT", sym: "A", key: "ada", side: "Sell", type: "Market",      price: 0.4712,  amount: 9800,   filled: 9800,   status: "Filled",    date: "2025-08-10", time: "21:08:39" },
  { id: "8469104", pair: "DOGE / USDT",sym: "D", key: "doge",side: "Buy",  type: "Limit",       price: 0.1188,  amount: 42000,  filled: 42000,  status: "Filled",    date: "2025-08-10", time: "18:22:07" },
  { id: "8468877", pair: "BTC / USDT", sym: "B", key: "btc", side: "Sell", type: "Take Profit", price: 66980.0, amount: 0.22,   filled: 0.22,   status: "Filled",    date: "2025-08-10", time: "14:57:12" },
  { id: "8468640", pair: "MATIC / USDT",sym:"M", key: "matic",side:"Buy",  type: "Limit",       price: 0.6034,  amount: 15200,  filled: 0,      status: "Rejected",  date: "2025-08-10", time: "11:15:44" },
  { id: "8468412", pair: "ETH / USDT", sym: "E", key: "eth", side: "Sell", type: "Limit",       price: 3588.9,  amount: 3.1,    filled: 3.1,    status: "Filled",    date: "2025-08-09", time: "20:41:03" },
  { id: "8468190", pair: "SOL / USDT", sym: "S", key: "sol", side: "Buy",  type: "Market",      price: 138.72,  amount: 64,     filled: 64,     status: "Filled",    date: "2025-08-09", time: "17:29:55" },
  { id: "8467955", pair: "DOT / USDT", sym: "D", key: "dot", side: "Buy",  type: "Limit",       price: 7.42,    amount: 480,    filled: 168,    status: "Partial",   date: "2025-08-09", time: "13:06:21" },
  { id: "8467701", pair: "XRP / USDT", sym: "X", key: "xrp", side: "Sell", type: "Limit",       price: 0.6488,  amount: 12000,  filled: 0,      status: "Cancelled", date: "2025-08-08", time: "23:14:36" },
  { id: "8467488", pair: "BNB / USDT", sym: "B", key: "bnb", side: "Buy",  type: "Limit",       price: 588.1,   amount: 9.4,    filled: 9.4,    status: "Filled",    date: "2025-08-08", time: "19:50:08" },
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
  matic: "#8247e5",
  dot: "#e6007a",
};

/* Outcome styling in one place, so the badge, the doughnut slice and the
   legend all read from the same source. rgb feeds CSS (which mixes its own
   alphas), hex feeds Chart.js (which needs a literal colour string). */
const STATUS_META = {
  Filled: { icon: CheckCircle2, hex: "#00c281", rgb: "0, 194, 129" },
  Partial: { icon: Clock, hex: "#f59e0b", rgb: "245, 158, 11" },
  Cancelled: { icon: XCircle, hex: "#7b899b", rgb: "123, 137, 155" },
  Expired: { icon: Clock, hex: "#3b82f6", rgb: "59, 130, 246" },
  Rejected: { icon: Ban, hex: "#e84142", rgb: "232, 65, 66" },
};

const TABS = [
  { id: "all", label: "All Orders" },
  { id: "Filled", label: "Filled" },
  { id: "Partial", label: "Partial" },
  { id: "Cancelled", label: "Cancelled" },
  { id: "Rejected", label: "Unfilled" },
];

const SORTS = [
  { id: "recent", label: "Most Recent" },
  { id: "oldest", label: "Oldest First" },
  { id: "value", label: "Order Value" },
  { id: "fee", label: "Fee Paid" },
];

const PAGE_SIZES = [8, 12, 16];

/* ============================================================== derived ===*/

const derive = (order) => {
  const { price, amount, filled, status } = order;
  const value = price * amount;
  const traded = price * filled;
  const fillPct = amount > 0 ? (filled / amount) * 100 : 0;
  // Only executed quantity is charged
  const fee = traded * FEE_RATE;

  return {
    ...order,
    value,
    traded,
    fillPct,
    fee,
    // "Unfilled" groups the outcomes that never executed at all
    unfilled: status === "Rejected" || status === "Expired",
    // Sortable key: the fixtures use ISO dates, so string order is time order
    stamp: `${order.date} ${order.time}`,
  };
};

const ROWS = HISTORY.map(derive);

/* =============================================================== format ===*/

const money = (value, dp = 2) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });

/* Sub-dollar assets need significant digits, not two decimals: $0.6212 must
   not round away to $0.62 */
const price = (value) => (value >= 1 ? money(value) : value.toPrecision(4));

const qty = (value) => money(value, value < 10 ? 4 : value < 1000 ? 2 : 0);

const shortDate = (iso) => {
  const [, month, day] = iso.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${day} ${months[Number(month) - 1]}`;
};

/* ============================================================ components ===*/

const CoinMark = ({ coinKey, sym, size }) => (
  <span
    className={`or-coin${size ? ` or-coin--${size}` : ""}`}
    style={{ backgroundColor: COIN_COLORS[coinKey] || "#6b7280" }}
    aria-hidden="true"
  >
    {sym}
  </span>
);

const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || STATUS_META.Cancelled;
  const Icon = meta.icon;
  return (
    <span className="or-status" style={{ "--status-rgb": meta.rgb }}>
      <Icon size={11} />
      {status}
    </span>
  );
};

const FillBar = ({ pct }) => (
  <span className="or-fill">
    <span className="or-fill-track">
      <span
        className={`or-fill-bar ${pct >= 100 ? "is-full" : pct > 0 ? "is-partial" : ""}`}
        style={{ width: `${Math.max(pct > 0 ? 4 : 0, Math.min(100, pct))}%` }}
      />
    </span>
    <small>{pct.toFixed(0)}%</small>
  </span>
);

/* ============================================================= component ===*/

const Orders = () => {
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [expanded, setExpanded] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const chart = useChartTheme();

  const totals = useMemo(() => {
    const traded = ROWS.reduce((sum, r) => sum + r.traded, 0);
    const fees = ROWS.reduce((sum, r) => sum + r.fee, 0);
    const filled = ROWS.filter((r) => r.status === "Filled").length;
    return {
      count: ROWS.length,
      traded,
      fees,
      filled,
      // Execution rate is what a trader judges their order placement by
      fillRate: ROWS.length > 0 ? (filled / ROWS.length) * 100 : 0,
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return ROWS.filter((r) => {
      if (q && !`${r.pair} ${r.type} ${r.id}`.toLowerCase().includes(q)) {
        return false;
      }
      if (tab === "Rejected") return r.unfilled;
      if (tab !== "all") return r.status === tab;
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

  /* Outcome breakdown for the doughnut */
  const byStatus = useMemo(() => {
    const groups = new Map();
    for (const row of ROWS) {
      groups.set(row.status, (groups.get(row.status) || 0) + 1);
    }
    return [...groups.entries()]
      .map(([status, count]) => ({
        status,
        count,
        pct: (count / ROWS.length) * 100,
        color: STATUS_META[status]?.hex || "#6b7280",
      }))
      .sort((a, b) => b.count - a.count);
  }, []);

  /* Traded value per pair, biggest first */
  const topPairs = useMemo(() => {
    const groups = new Map();
    for (const row of ROWS) {
      groups.set(row.pair, {
        traded: (groups.get(row.pair)?.traded || 0) + row.traded,
        key: row.key,
        sym: row.sym,
      });
    }
    const list = [...groups.entries()].map(([pair, v]) => ({ pair, ...v }));
    const peak = Math.max(...list.map((p) => p.traded), 1);
    return list
      .sort((a, b) => b.traded - a.traded)
      .slice(0, 5)
      .map((p) => ({ ...p, width: (p.traded / peak) * 100 }));
  }, []);

  const doughnutData = {
    labels: byStatus.map((s) => s.status),
    datasets: [
      {
        data: byStatus.map((s) => s.count),
        backgroundColor: byStatus.map((s) => s.color),
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
          label: (item) => `${item.parsed} order${item.parsed === 1 ? "" : "s"}`,
        },
      },
    },
  };

  const metrics = [
    {
      key: "count",
      icon: History,
      label: "Total Orders",
      value: String(totals.count),
      sub: "Last 30 days",
      tone: "neutral",
    },
    {
      key: "traded",
      icon: Receipt,
      label: "Volume Traded",
      value: `$${money(totals.traded, 0)}`,
      sub: "Executed notional",
      tone: "neutral",
    },
    {
      key: "rate",
      icon: CheckCircle2,
      label: "Fill Rate",
      value: `${totals.fillRate.toFixed(1)}%`,
      sub: `${totals.filled} of ${totals.count} fully filled`,
      tone: "up",
    },
    {
      key: "fees",
      icon: Percent,
      label: "Fees Paid",
      value: `$${money(totals.fees)}`,
      sub: `${(FEE_RATE * 100).toFixed(1)}% taker rate`,
      tone: "neutral",
    },
  ];

  return (
    <section className="or-page">
      {/* ============================ HEADER =========================== */}
      <header className="or-header">
        <div className="or-heading">
          <span className="or-heading-icon">
            <History size={19} />
          </span>
          <div>
            <h1 className="or-title">Order History</h1>
            <p className="or-subtitle">
              Every order you have placed, with execution, fees and outcome in
              one record.
            </p>
          </div>
        </div>

        <div className="or-header-actions">
          <button type="button" className="or-btn or-btn--ghost">
            <Calendar size={14} /> Last 30 days
          </button>
          <button type="button" className="or-btn or-btn--ghost">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </header>

      {/* ============================ METRICS ========================== */}
      <div className="or-metrics">
        {metrics.map(({ key, icon: Icon, label, value, sub, tone }) => (
          <div className={`or-card or-metric is-${tone}`} key={key}>
            <span className="or-metric-icon">
              <Icon size={16} />
            </span>
            <div className="or-metric-body">
              <span className="or-metric-label">{label}</span>
              <strong className="or-metric-value">{value}</strong>
              <span className="or-metric-sub">{sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ============================= GRID ============================ */}
      <div className="or-grid">
        {/* --------------------------- HISTORY ------------------------ */}
        <div className="or-card">
          <div className="or-toolbar">
            <div className="or-tabs" role="tablist" aria-label="Filter orders">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  className={`or-tab ${tab === t.id ? "is-active" : ""}`}
                  onClick={() => resetTo(() => setTab(t.id))}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="or-tools">
              <label className="or-sort">
                <ArrowUpDown size={13} />
                <select
                  value={sortBy}
                  onChange={(e) => resetTo(() => setSortBy(e.target.value))}
                  aria-label="Sort orders by"
                >
                  {SORTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="or-search">
                <Search size={14} />
                <input
                  type="search"
                  value={query}
                  placeholder="Search pair or order ID..."
                  aria-label="Search order history"
                  onChange={(e) => resetTo(() => setQuery(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="or-table-scroll">
            <table className="or-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Pair</th>
                  <th>Type</th>
                  <th>Side</th>
                  <th className="or-num">Price</th>
                  <th className="or-num">Amount</th>
                  <th>Filled</th>
                  <th className="or-num">Total</th>
                  <th className="or-num">Fee</th>
                  <th>Status</th>
                  <th aria-label="Details" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <Fragment key={row.id}>
                    <tr className={expanded === row.id ? "is-open" : ""}>
                      <td data-label="Date" className="or-cell-date">
                        <b>{shortDate(row.date)}</b>
                        <small>{row.time}</small>
                      </td>
                      <td data-label="Pair" className="or-cell-pair">
                        <CoinMark coinKey={row.key} sym={row.sym} />
                        <span className="or-pair-text">
                          <b>{row.pair}</b>
                          <small>#{row.id}</small>
                        </span>
                      </td>
                      <td data-label="Type">{row.type}</td>
                      <td data-label="Side">
                        <span
                          className={`or-side ${row.side === "Buy" ? "is-buy" : "is-sell"}`}
                        >
                          {row.side}
                        </span>
                      </td>
                      <td data-label="Price" className="or-num or-strong">
                        {price(row.price)}
                      </td>
                      <td data-label="Amount" className="or-num">
                        {qty(row.amount)}
                      </td>
                      <td data-label="Filled">
                        <FillBar pct={row.fillPct} />
                      </td>
                      <td data-label="Total" className="or-num">
                        ${money(row.traded)}
                      </td>
                      <td data-label="Fee" className="or-num or-muted">
                        {row.fee > 0 ? `$${money(row.fee)}` : "—"}
                      </td>
                      <td data-label="Status">
                        <StatusBadge status={row.status} />
                      </td>
                      <td data-label="Details" className="or-cell-actions">
                        <button
                          type="button"
                          className="or-icon-btn"
                          aria-expanded={expanded === row.id}
                          aria-label={`Details for order ${row.id}`}
                          onClick={() =>
                            setExpanded(expanded === row.id ? null : row.id)
                          }
                        >
                          <ChevronDown
                            size={14}
                            className={expanded === row.id ? "is-flipped" : ""}
                          />
                        </button>
                      </td>
                    </tr>

                    {expanded === row.id && (
                      <tr className="or-detail-row">
                        <td colSpan={11}>
                          <div className="or-detail">
                            <div className="or-detail-block">
                              <span className="or-detail-label">
                                <Hash size={12} /> Order ID
                              </span>
                              <b>#{row.id}</b>
                              <small>
                                {row.type} · {row.side.toLowerCase()}
                              </small>
                            </div>

                            <div className="or-detail-block">
                              <span className="or-detail-label">
                                <Receipt size={12} /> Executed
                              </span>
                              <b>
                                {qty(row.filled)} / {qty(row.amount)}
                              </b>
                              <small>{row.fillPct.toFixed(1)}% of order</small>
                            </div>

                            <div className="or-detail-block">
                              <span className="or-detail-label">
                                <Percent size={12} /> Fee
                              </span>
                              <b>
                                {row.fee > 0 ? `$${money(row.fee)}` : "No fee"}
                              </b>
                              <small>
                                {row.fee > 0
                                  ? `${(FEE_RATE * 100).toFixed(1)}% of $${money(row.traded)}`
                                  : "Nothing executed"}
                              </small>
                            </div>

                            <div className="or-detail-block">
                              <span className="or-detail-label">
                                <Clock size={12} /> Placed
                              </span>
                              <b>{shortDate(row.date)}</b>
                              <small>{row.time}</small>
                            </div>

                            <div className="or-detail-actions">
                              <button type="button" className="or-btn or-btn--ghost">
                                View Trades
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}

                {rows.length === 0 && (
                  <tr className="or-empty-row">
                    <td colSpan={11}>
                      <div className="or-empty">
                        <History size={20} />
                        <p>No orders match this filter.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="or-table-foot">
            <span className="or-muted">
              {filtered.length === 0
                ? "No orders"
                : `Showing ${start + 1} to ${Math.min(start + pageSize, filtered.length)} of ${filtered.length} orders`}
            </span>

            <div className="or-pager">
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

            <label className="or-rows">
              <span className="or-muted">Rows:</span>
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
        <aside className="or-side">
          <div className="or-card">
            <h2 className="or-card-title">Order Outcomes</h2>

            <div className="or-alloc">
              <div className="or-donut">
                <Doughnut data={doughnutData} options={doughnutOptions} />
                <div className="or-donut-center">
                  <strong>{totals.fillRate.toFixed(0)}%</strong>
                  <span>Fill rate</span>
                </div>
              </div>

              <ul className="or-legend">
                {byStatus.map((slice) => (
                  <li key={slice.status}>
                    <i style={{ backgroundColor: slice.color }} />
                    <span>{slice.status}</span>
                    <b>{slice.count}</b>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="or-card">
            <h2 className="or-card-title">Most Traded</h2>

            <ul className="or-top-list">
              {topPairs.map((p) => (
                <li key={p.pair}>
                  <span className="or-top-pair">
                    <CoinMark coinKey={p.key} sym={p.sym} size="sm" />
                    {p.pair.split(" ")[0]}
                  </span>
                  <span className="or-top-bar">
                    <i style={{ width: `${Math.max(4, p.width)}%` }} />
                  </span>
                  <b>${money(p.traded, 0)}</b>
                </li>
              ))}
            </ul>
          </div>

          <div className="or-card">
            <h2 className="or-card-title">Activity Summary</h2>

            <dl className="or-summary">
              <div>
                <dt>Buy Orders</dt>
                <dd className="or-up">
                  {ROWS.filter((r) => r.side === "Buy").length}
                </dd>
              </div>
              <div>
                <dt>Sell Orders</dt>
                <dd className="or-down">
                  {ROWS.filter((r) => r.side === "Sell").length}
                </dd>
              </div>
              <div>
                <dt>Partially Filled</dt>
                <dd>{ROWS.filter((r) => r.status === "Partial").length}</dd>
              </div>
              <div>
                <dt>Never Executed</dt>
                <dd>{ROWS.filter((r) => r.filled === 0).length}</dd>
              </div>
              <div>
                <dt>Avg. Order Value</dt>
                <dd>
                  $
                  {money(
                    ROWS.reduce((s, r) => s + r.value, 0) / ROWS.length,
                    0,
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default Orders;
