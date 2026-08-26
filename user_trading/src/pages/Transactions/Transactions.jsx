import { Fragment, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import {
  ReceiptText,
  ArrowDownLeft,
  ArrowUpRight,
  Repeat,
  Percent,
  Search,
  ArrowUpDown,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  ExternalLink,
} from "lucide-react";
import "./Transactions.css";
import useChartTheme from "../../utils/chartTheme";

ChartJS.register(ArcElement, ChartTooltip);

/* ================================================================== data ===
   Only the raw facts of each entry are stored - type, asset, amount, price
   and status. The DIRECTION of money (in or out) is derived from the type
   rather than stored as a sign, so a deposit can never be recorded as an
   outflow and the totals cannot disagree with the rows they came from. */

const TYPES = {
  Deposit: { icon: ArrowDownLeft, direction: "in", hex: "#00c281", rgb: "0, 194, 129" },
  Withdrawal: { icon: ArrowUpRight, direction: "out", hex: "#e84142", rgb: "232, 65, 66" },
  Trade: { icon: Repeat, direction: "in", hex: "#3b82f6", rgb: "59, 130, 246" },
  Fee: { icon: Percent, direction: "out", hex: "#f59e0b", rgb: "245, 158, 11" },
};

const LEDGER = [
  { id: "TX8471023", type: "Deposit",    sym: "USDT", key: "usdt", amount: 10000,  price: 1,       status: "Completed", date: "2025-08-12", time: "09:41", ref: "TRC-20", hash: "0x4f2a…9c21" },
  { id: "TX8470991", type: "Fee",        sym: "USDT", key: "usdt", amount: 31.58,  price: 1,       status: "Completed", date: "2025-08-12", time: "09:38", ref: "Trading fee", hash: "—" },
  { id: "TX8470884", type: "Trade",      sym: "BTC",  key: "btc",  amount: 0.42,   price: 66980,   status: "Completed", date: "2025-08-12", time: "08:12", ref: "BTC / USDT", hash: "—" },
  { id: "TX8470612", type: "Withdrawal", sym: "BTC",  key: "btc",  amount: 0.15,   price: 67245.8, status: "Completed", date: "2025-08-11", time: "18:22", ref: "Bitcoin", hash: "bc1q…f5mdq" },
  { id: "TX8470118", type: "Deposit",    sym: "ETH",  key: "eth",  amount: 4.2,    price: 3512.75, status: "Pending",   date: "2025-08-11", time: "14:05", ref: "ERC-20", hash: "0x2F81…3A6E4" },
  { id: "TX8469950", type: "Trade",      sym: "ETH",  key: "eth",  amount: 4.8,    price: 3588.9,  status: "Completed", date: "2025-08-11", time: "12:47", ref: "ETH / USDT", hash: "—" },
  { id: "TX8469744", type: "Fee",        sym: "ETH",  key: "eth",  amount: 0.0172, price: 3512.75, status: "Completed", date: "2025-08-11", time: "12:47", ref: "Trading fee", hash: "—" },
  { id: "TX8469501", type: "Withdrawal", sym: "USDT", key: "usdt", amount: 2400,   price: 1,       status: "Rejected",  date: "2025-08-10", time: "21:38", ref: "ERC-20", hash: "0x9E12…1E883" },
  { id: "TX8469320", type: "Deposit",    sym: "USDT", key: "usdt", amount: 5000,   price: 1,       status: "Completed", date: "2025-08-10", time: "16:12", ref: "ERC-20", hash: "0x7a3F…9C21" },
  { id: "TX8469104", type: "Trade",      sym: "SOL",  key: "sol",  amount: 96,     price: 138.72,  status: "Completed", date: "2025-08-10", time: "11:15", ref: "SOL / USDT", hash: "—" },
  { id: "TX8468877", type: "Withdrawal", sym: "SOL",  key: "sol",  amount: 62,     price: 142.35,  status: "Completed", date: "2025-08-09", time: "20:41", ref: "Solana", hash: "7xKX…LNXon" },
  { id: "TX8468640", type: "Fee",        sym: "USDT", key: "usdt", amount: 12.4,   price: 1,       status: "Completed", date: "2025-08-09", time: "17:29", ref: "Withdrawal fee", hash: "—" },
  { id: "TX8468412", type: "Deposit",    sym: "BNB",  key: "bnb",  amount: 21.4,   price: 602.45,  status: "Completed", date: "2025-08-08", time: "23:14", ref: "BEP-20", hash: "0x5A0b…7E56" },
  { id: "TX8468190", type: "Trade",      sym: "LINK", key: "link", amount: 300,    price: 16.25,   status: "Completed", date: "2025-08-08", time: "19:50", ref: "LINK / USDT", hash: "—" },
  { id: "TX8467955", type: "Withdrawal", sym: "ETH",  key: "eth",  amount: 2.4,    price: 3512.75, status: "Pending",   date: "2025-08-07", time: "13:06", ref: "ERC-20", hash: "0xC71b…2C77" },
  { id: "TX8467701", type: "Fee",        sym: "BTC",  key: "btc",  amount: 0.0002, price: 67245.8, status: "Completed", date: "2025-08-07", time: "10:22", ref: "Network fee", hash: "—" },
];

/* Asset-brand colours: these identify a coin, not a surface, so they are
   deliberately literal and stay fixed in both themes. */
const COIN_COLORS = {
  usdt: "#26a17b",
  btc: "#f7931a",
  eth: "#627eea",
  sol: "#14f195",
  bnb: "#f3ba2f",
  link: "#2a5ada",
};

const TABS = [
  { id: "all", label: "All" },
  { id: "Deposit", label: "Deposits" },
  { id: "Withdrawal", label: "Withdrawals" },
  { id: "Trade", label: "Trades" },
  { id: "Fee", label: "Fees" },
];

const SORTS = [
  { id: "recent", label: "Most Recent" },
  { id: "oldest", label: "Oldest First" },
  { id: "value", label: "Largest Value" },
];

const PAGE_SIZES = [8, 12, 16];

/* ============================================================== derived ===*/

const derive = (entry) => {
  const meta = TYPES[entry.type];
  const value = entry.amount * entry.price;

  return {
    ...entry,
    direction: meta.direction,
    color: meta.hex,
    rgb: meta.rgb,
    value,
    /* Rejected entries never moved money, so they must not count toward any
       total even though they stay visible in the ledger */
    counted: entry.status !== "Rejected",
    stamp: `${entry.date} ${entry.time}`,
  };
};

const ROWS = LEDGER.map(derive);

const IN_VALUE = ROWS.filter((r) => r.counted && r.direction === "in").reduce(
  (sum, r) => sum + r.value,
  0,
);
const OUT_VALUE = ROWS.filter((r) => r.counted && r.direction === "out").reduce(
  (sum, r) => sum + r.value,
  0,
);
const NET_VALUE = IN_VALUE - OUT_VALUE;
const FEES_VALUE = ROWS.filter((r) => r.counted && r.type === "Fee").reduce(
  (sum, r) => sum + r.value,
  0,
);

/* =============================================================== format ===*/

const money = (value, dp = 2) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });

/* Crypto amounts need enough precision that a fee of 0.0002 BTC is visible;
   a flat 2dp would render it as 0.00 */
const coin = (value) => money(value, value < 1 ? 6 : value < 1000 ? 4 : 2);

const shortDate = (iso) => {
  const [, month, day] = iso.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${day} ${months[Number(month) - 1]}`;
};

/* ============================================================ components ===*/

const CoinMark = ({ coinKey, sym, size }) => (
  <span
    className={`tx-coin${size ? ` tx-coin--${size}` : ""}`}
    style={{ backgroundColor: COIN_COLORS[coinKey] || "#6b7280" }}
    aria-hidden="true"
  >
    {sym.charAt(0)}
  </span>
);

const StatusBadge = ({ status }) => (
  <span className={`tx-status is-${status.toLowerCase()}`}>
    {status === "Completed" && <CheckCircle2 size={11} />}
    {status === "Pending" && <Clock size={11} />}
    {status === "Rejected" && <XCircle size={11} />}
    {status}
  </span>
);

/* ============================================================= component ===*/

const Transactions = () => {
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [expanded, setExpanded] = useState(null);
  const [copied, setCopied] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const chart = useChartTheme();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return ROWS.filter((r) => {
      if (q && !`${r.id} ${r.sym} ${r.type} ${r.ref}`.toLowerCase().includes(q)) {
        return false;
      }
      if (tab !== "all") return r.type === tab;
      return true;
    }).sort((a, b) => {
      if (sortBy === "oldest") return a.stamp.localeCompare(b.stamp);
      if (sortBy === "value") return b.value - a.value;
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

  const copy = (id) => {
    setCopied(id);
    // Revert so the button does not stay stuck reading "Copied"
    window.setTimeout(() => setCopied(""), 1600);
  };

  /* Value moved per type, for the doughnut */
  const byType = useMemo(() => {
    const groups = new Map();
    for (const row of ROWS) {
      if (!row.counted) continue;
      groups.set(row.type, (groups.get(row.type) || 0) + row.value);
    }
    const total = [...groups.values()].reduce((a, b) => a + b, 0);
    return [...groups.entries()]
      .map(([type, value]) => ({
        type,
        value,
        pct: total > 0 ? (value / total) * 100 : 0,
        color: TYPES[type].hex,
        count: ROWS.filter((r) => r.counted && r.type === type).length,
      }))
      .sort((a, b) => b.value - a.value);
  }, []);

  const doughnutData = {
    labels: byType.map((t) => t.type),
    datasets: [
      {
        data: byType.map((t) => t.value),
        backgroundColor: byType.map((t) => t.color),
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
        callbacks: { label: (item) => `$${money(item.parsed, 0)}` },
      },
    },
  };

  const metrics = [
    {
      key: "in",
      icon: ArrowDownLeft,
      label: "Total In",
      value: `$${money(IN_VALUE, 0)}`,
      sub: `${ROWS.filter((r) => r.counted && r.direction === "in").length} inflows`,
      tone: "up",
    },
    {
      key: "out",
      icon: ArrowUpRight,
      label: "Total Out",
      value: `$${money(OUT_VALUE, 0)}`,
      sub: `${ROWS.filter((r) => r.counted && r.direction === "out").length} outflows`,
      tone: "down",
    },
    {
      key: "net",
      icon: ArrowUpDown,
      label: "Net Flow",
      value: `${NET_VALUE >= 0 ? "+" : "-"}$${money(Math.abs(NET_VALUE), 0)}`,
      sub: "In minus out",
      tone: NET_VALUE >= 0 ? "up" : "down",
    },
    {
      key: "fees",
      icon: Percent,
      label: "Fees Paid",
      value: `$${money(FEES_VALUE)}`,
      sub: `${ROWS.filter((r) => r.counted && r.type === "Fee").length} fee entries`,
      tone: "warn",
    },
  ];

  return (
    <section className="tx-page">
      {/* ============================ HEADER =========================== */}
      <header className="tx-header">
        <div className="tx-heading">
          <span className="tx-heading-icon">
            <ReceiptText size={19} />
          </span>
          <div>
            <h1 className="tx-title">Transactions</h1>
            <p className="tx-subtitle">
              Every movement on your account — deposits, withdrawals, trades
              and fees — in one ledger.
            </p>
          </div>
        </div>

        <div className="tx-header-actions">
          <button type="button" className="tx-btn tx-btn--ghost">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </header>

      {/* ============================ METRICS ========================== */}
      <div className="tx-metrics">
        {metrics.map(({ key, icon: Icon, label, value, sub, tone }) => (
          <div className={`tx-card tx-metric is-${tone}`} key={key}>
            <span className="tx-metric-icon">
              <Icon size={16} />
            </span>
            <div className="tx-metric-body">
              <span className="tx-metric-label">{label}</span>
              <strong className="tx-metric-value">{value}</strong>
              <span className="tx-metric-sub">{sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ============================= GRID ============================ */}
      <div className="tx-grid">
        {/* --------------------------- LEDGER ------------------------- */}
        <div className="tx-card">
          <div className="tx-toolbar">
            <div className="tx-tabs" role="tablist" aria-label="Filter by type">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  className={`tx-tab ${tab === t.id ? "is-active" : ""}`}
                  onClick={() => resetTo(() => setTab(t.id))}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="tx-tools">
              <label className="tx-sort">
                <ArrowUpDown size={13} />
                <select
                  value={sortBy}
                  onChange={(e) => resetTo(() => setSortBy(e.target.value))}
                  aria-label="Sort transactions by"
                >
                  {SORTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="tx-search">
                <Search size={14} />
                <input
                  type="search"
                  value={query}
                  placeholder="Search ID, asset or type..."
                  aria-label="Search transactions"
                  onChange={(e) => resetTo(() => setQuery(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="tx-table-scroll">
            <table className="tx-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Asset</th>
                  <th className="tx-num">Amount</th>
                  <th className="tx-num">Value</th>
                  <th>Reference</th>
                  <th>Status</th>
                  <th aria-label="Details" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const Icon = TYPES[row.type].icon;
                  const isIn = row.direction === "in";

                  return (
                    <Fragment key={row.id}>
                      <tr className={expanded === row.id ? "is-open" : ""}>
                        <td data-label="Date" className="tx-cell-date">
                          <b>{shortDate(row.date)}</b>
                          <small>{row.time}</small>
                        </td>
                        <td data-label="Type">
                          <span
                            className="tx-type"
                            style={{ "--type-rgb": row.rgb }}
                          >
                            <Icon size={11} />
                            {row.type}
                          </span>
                        </td>
                        <td data-label="Asset" className="tx-cell-asset">
                          <CoinMark coinKey={row.key} sym={row.sym} size="sm" />
                          <b>{row.sym}</b>
                        </td>
                        <td data-label="Amount" className="tx-num">
                          <b className={isIn ? "tx-up" : "tx-down"}>
                            {isIn ? "+" : "−"}
                            {coin(row.amount)}
                          </b>
                        </td>
                        <td data-label="Value" className="tx-num tx-strong">
                          ${money(row.value)}
                        </td>
                        <td data-label="Reference" className="tx-muted">
                          {row.ref}
                        </td>
                        <td data-label="Status">
                          <StatusBadge status={row.status} />
                        </td>
                        <td data-label="Details" className="tx-cell-actions">
                          <button
                            type="button"
                            className="tx-icon-btn"
                            aria-expanded={expanded === row.id}
                            aria-label={`Details for ${row.id}`}
                            onClick={() =>
                              setExpanded(expanded === row.id ? null : row.id)
                            }
                          >
                            <ChevronDown
                              size={14}
                              className={
                                expanded === row.id ? "is-flipped" : ""
                              }
                            />
                          </button>
                        </td>
                      </tr>

                      {expanded === row.id && (
                        <tr className="tx-detail-row">
                          <td colSpan={8}>
                            <div className="tx-detail">
                              <div className="tx-detail-block">
                                <span className="tx-detail-label">
                                  Transaction ID
                                </span>
                                <span className="tx-copyable">
                                  <b>{row.id}</b>
                                  <button
                                    type="button"
                                    onClick={() => copy(row.id)}
                                    aria-label={`Copy ${row.id}`}
                                  >
                                    {copied === row.id ? (
                                      <CheckCircle2 size={12} />
                                    ) : (
                                      <Copy size={12} />
                                    )}
                                  </button>
                                </span>
                              </div>

                              <div className="tx-detail-block">
                                <span className="tx-detail-label">
                                  On-chain hash
                                </span>
                                {row.hash === "—" ? (
                                  <b className="tx-muted">
                                    Internal — no on-chain record
                                  </b>
                                ) : (
                                  <span className="tx-copyable">
                                    <b>{row.hash}</b>
                                    <a
                                      href="#explorer"
                                      aria-label="View on explorer"
                                    >
                                      <ExternalLink size={12} />
                                    </a>
                                  </span>
                                )}
                              </div>

                              <div className="tx-detail-block">
                                <span className="tx-detail-label">Amount</span>
                                <b>
                                  {coin(row.amount)} {row.sym}
                                </b>
                                <small>
                                  at ${money(row.price)} per {row.sym}
                                </small>
                              </div>

                              <div className="tx-detail-block">
                                <span className="tx-detail-label">
                                  Direction
                                </span>
                                <b className={isIn ? "tx-up" : "tx-down"}>
                                  {isIn ? "Inflow" : "Outflow"}
                                </b>
                                <small>
                                  {row.counted
                                    ? "Counted in totals"
                                    : "Rejected — excluded from totals"}
                                </small>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}

                {rows.length === 0 && (
                  <tr className="tx-empty-row">
                    <td colSpan={8}>
                      <div className="tx-empty">
                        <ReceiptText size={20} />
                        <p>No transactions match this filter.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="tx-table-foot">
            <span className="tx-muted">
              {filtered.length === 0
                ? "No transactions"
                : `Showing ${start + 1} to ${Math.min(start + pageSize, filtered.length)} of ${filtered.length}`}
            </span>

            <div className="tx-pager">
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

            <label className="tx-rows">
              <span className="tx-muted">Rows:</span>
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
        <aside className="tx-side">
          <div className="tx-card">
            <h2 className="tx-card-title">Value by Type</h2>

            <div className="tx-alloc">
              <div className="tx-donut">
                <Doughnut data={doughnutData} options={doughnutOptions} />
                <div className="tx-donut-center">
                  <strong>{ROWS.filter((r) => r.counted).length}</strong>
                  <span>Entries</span>
                </div>
              </div>

              <ul className="tx-legend">
                {byType.map((slice) => (
                  <li key={slice.type}>
                    <i style={{ backgroundColor: slice.color }} />
                    <span>{slice.type}</span>
                    <b>{slice.count}</b>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="tx-card">
            <h2 className="tx-card-title">Money Flow</h2>

            {/* One bar, two segments. Widths come from the same figures the
                metric cards use, so the bar cannot disagree with them. */}
            <div className="tx-flow">
              <div className="tx-flow-row">
                <span className="tx-muted">
                  <ArrowDownLeft size={11} /> In
                </span>
                <b className="tx-up">${money(IN_VALUE, 0)}</b>
              </div>
              <span className="tx-flow-track">
                <i
                  className="is-in"
                  style={{
                    width: `${(IN_VALUE / (IN_VALUE + OUT_VALUE)) * 100}%`,
                  }}
                />
              </span>

              <div className="tx-flow-row">
                <span className="tx-muted">
                  <ArrowUpRight size={11} /> Out
                </span>
                <b className="tx-down">${money(OUT_VALUE, 0)}</b>
              </div>
              <span className="tx-flow-track">
                <i
                  className="is-out"
                  style={{
                    width: `${(OUT_VALUE / (IN_VALUE + OUT_VALUE)) * 100}%`,
                  }}
                />
              </span>

              <div className="tx-flow-net">
                <span>Net flow</span>
                <b className={NET_VALUE >= 0 ? "tx-up" : "tx-down"}>
                  {NET_VALUE >= 0 ? "+" : "−"}${money(Math.abs(NET_VALUE), 0)}
                </b>
              </div>
            </div>
          </div>

          <div className="tx-card">
            <h2 className="tx-card-title">Ledger Summary</h2>

            <dl className="tx-summary">
              <div>
                <dt>Total Entries</dt>
                <dd>{ROWS.length}</dd>
              </div>
              <div>
                <dt>Completed</dt>
                <dd className="tx-up">
                  {ROWS.filter((r) => r.status === "Completed").length}
                </dd>
              </div>
              <div>
                <dt>Pending</dt>
                <dd className="tx-warn">
                  {ROWS.filter((r) => r.status === "Pending").length}
                </dd>
              </div>
              <div>
                <dt>Rejected</dt>
                <dd className="tx-down">
                  {ROWS.filter((r) => r.status === "Rejected").length}
                </dd>
              </div>
              <div>
                <dt>Assets Involved</dt>
                <dd>{new Set(ROWS.map((r) => r.sym)).size}</dd>
              </div>
            </dl>

            <p className="tx-note">
              Rejected entries stay in the ledger for the record but are
              excluded from every total above.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default Transactions;
