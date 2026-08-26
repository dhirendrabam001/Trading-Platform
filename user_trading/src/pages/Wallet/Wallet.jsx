import { useMemo, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import {
  Wallet as WalletIcon,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
  Search,
  ArrowUpDown,
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  History,
  Copy,
} from "lucide-react";
import "./Wallet.css";
import useChartTheme from "../../utils/chartTheme";

ChartJS.register(ArcElement, ChartTooltip);

/* ================================================================== data ===
   Only the raw facts of each balance are stored - how much is free and how
   much is locked in open orders, plus the current price. Everything shown
   (total holding, USD value, allocation share) is DERIVED below, so a row can
   never display a total that disagrees with its own available and locked
   figures. */

const BALANCES = [
  { sym: "USDT", name: "Tether",    key: "usdt", available: 24562.34, inOrders: 8225.0,  price: 1 },
  { sym: "BTC",  name: "Bitcoin",   key: "btc",  available: 0.842,    inOrders: 0.125,   price: 67245.8 },
  { sym: "ETH",  name: "Ethereum",  key: "eth",  available: 9.15,     inOrders: 2.5,     price: 3512.75 },
  { sym: "SOL",  name: "Solana",    key: "sol",  available: 148.2,    inOrders: 46.0,    price: 142.35 },
  { sym: "BNB",  name: "BNB",       key: "bnb",  available: 21.4,     inOrders: 8.0,     price: 602.45 },
  { sym: "XRP",  name: "XRP",       key: "xrp",  available: 14200,    inOrders: 0,       price: 0.5987 },
  { sym: "LINK", name: "Chainlink", key: "link", available: 486,      inOrders: 320,     price: 16.25 },
  { sym: "ADA",  name: "Cardano",   key: "ada",  available: 18500,    inOrders: 9800,    price: 0.4567 },
];

/* Asset-brand colours: these identify a coin, not a surface, so they are
   deliberately literal and stay fixed in both themes. */
const COIN_COLORS = {
  usdt: "#26a17b",
  btc: "#f7931a",
  eth: "#627eea",
  sol: "#14f195",
  bnb: "#f3ba2f",
  xrp: "#5c6773",
  link: "#2a5ada",
  ada: "#0033ad",
};

const TRANSACTIONS = [
  { id: "x1", type: "Deposit",  sym: "USDT", key: "usdt", amount: 10000,  status: "Completed", time: "12 Aug, 09:41" },
  { id: "x2", type: "Withdraw", sym: "BTC",  key: "btc",  amount: 0.15,   status: "Completed", time: "11 Aug, 18:22" },
  { id: "x3", type: "Deposit",  sym: "ETH",  key: "eth",  amount: 4.2,    status: "Pending",   time: "11 Aug, 14:05" },
  { id: "x4", type: "Deposit",  sym: "USDT", key: "usdt", amount: 5000,   status: "Completed", time: "10 Aug, 21:38" },
  { id: "x5", type: "Withdraw", sym: "SOL",  key: "sol",  amount: 62,     status: "Completed", time: "09 Aug, 11:17" },
];

const TABS = [
  { id: "all", label: "All Assets" },
  { id: "held", label: "With Balance" },
  { id: "locked", label: "In Orders" },
];

const SORTS = [
  { id: "value", label: "USD Value" },
  { id: "available", label: "Available" },
  { id: "locked", label: "In Orders" },
  { id: "name", label: "Name" },
];

const DEPOSIT_ADDRESS = "0x7a3F...9C21";

/* ============================================================== derived ===*/

const derive = (balance) => {
  const { available, inOrders, price } = balance;
  const total = available + inOrders;
  const value = total * price;
  const lockedValue = inOrders * price;
  const lockedPct = total > 0 ? (inOrders / total) * 100 : 0;

  return { ...balance, total, value, lockedValue, lockedPct };
};

const ROWS = BALANCES.map(derive);

const TOTAL_VALUE = ROWS.reduce((sum, r) => sum + r.value, 0);
const LOCKED_VALUE = ROWS.reduce((sum, r) => sum + r.lockedValue, 0);
const FREE_VALUE = TOTAL_VALUE - LOCKED_VALUE;
/* Portfolio expressed in BTC, the way an exchange quotes account size */
const BTC_PRICE = BALANCES.find((b) => b.sym === "BTC").price;

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

/* ============================================================ components ===*/

const CoinMark = ({ coinKey, sym, size }) => (
  <span
    className={`wa-coin${size ? ` wa-coin--${size}` : ""}`}
    style={{ backgroundColor: COIN_COLORS[coinKey] || "#6b7280" }}
    aria-hidden="true"
  >
    {sym.charAt(0)}
  </span>
);

/* ============================================================= component ===*/

const Wallet = () => {
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("value");
  const [hidden, setHidden] = useState(false);
  const [copied, setCopied] = useState(false);

  const chart = useChartTheme();

  /* Privacy mode masks every figure in one place, so a balance cannot leak
     through a card that forgot to check the flag */
  const mask = (text) => (hidden ? "••••••" : text);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();

    return ROWS.filter((r) => {
      if (q && !`${r.sym} ${r.name}`.toLowerCase().includes(q)) return false;
      if (tab === "held") return r.total > 0;
      if (tab === "locked") return r.inOrders > 0;
      return true;
    }).sort((a, b) => {
      if (sortBy === "available") return b.available * b.price - a.available * a.price;
      if (sortBy === "locked") return b.lockedValue - a.lockedValue;
      if (sortBy === "name") return a.sym.localeCompare(b.sym);
      return b.value - a.value;
    });
  }, [tab, query, sortBy]);

  const allocation = useMemo(
    () =>
      [...ROWS]
        .sort((a, b) => b.value - a.value)
        .map((r) => ({
          label: r.sym,
          pct: TOTAL_VALUE > 0 ? (r.value / TOTAL_VALUE) * 100 : 0,
          color: COIN_COLORS[r.key],
        })),
    [],
  );

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
      key: "total",
      icon: WalletIcon,
      label: "Total Balance",
      value: mask(`$${money(TOTAL_VALUE)}`),
      sub: mask(`≈ ${(TOTAL_VALUE / BTC_PRICE).toFixed(4)} BTC`),
      tone: "neutral",
    },
    {
      key: "free",
      icon: CheckCircle2,
      label: "Available",
      value: mask(`$${money(FREE_VALUE)}`),
      sub: `${((FREE_VALUE / TOTAL_VALUE) * 100).toFixed(1)}% free to trade`,
      tone: "up",
    },
    {
      key: "locked",
      icon: Lock,
      label: "In Open Orders",
      value: mask(`$${money(LOCKED_VALUE)}`),
      sub: `${((LOCKED_VALUE / TOTAL_VALUE) * 100).toFixed(1)}% reserved`,
      tone: "warn",
    },
    {
      key: "assets",
      icon: ArrowLeftRight,
      label: "Assets Held",
      value: String(ROWS.filter((r) => r.total > 0).length),
      sub: `${ROWS.filter((r) => r.inOrders > 0).length} with open orders`,
      tone: "neutral",
    },
  ];

  return (
    <section className="wa-page">
      {/* ============================ HEADER =========================== */}
      <header className="wa-header">
        <div className="wa-heading">
          <span className="wa-heading-icon">
            <WalletIcon size={19} />
          </span>
          <div>
            <h1 className="wa-title">Wallet</h1>
            <p className="wa-subtitle">
              Balances across every asset, with what is free to trade and what
              is reserved by open orders.
            </p>
          </div>
        </div>

        <div className="wa-header-actions">
          <button
            type="button"
            className="wa-btn wa-btn--ghost"
            onClick={() => setHidden((v) => !v)}
            aria-pressed={hidden}
          >
            {hidden ? <EyeOff size={14} /> : <Eye size={14} />}
            {hidden ? "Show" : "Hide"} balances
          </button>
          <button type="button" className="wa-btn wa-btn--primary">
            <ArrowDownCircle size={14} /> Deposit
          </button>
          <button type="button" className="wa-btn wa-btn--ghost">
            <ArrowUpCircle size={14} /> Withdraw
          </button>
        </div>
      </header>

      {/* ============================ METRICS ========================== */}
      <div className="wa-metrics">
        {metrics.map(({ key, icon: Icon, label, value, sub, tone }) => (
          <div className={`wa-card wa-metric is-${tone}`} key={key}>
            <span className="wa-metric-icon">
              <Icon size={16} />
            </span>
            <div className="wa-metric-body">
              <span className="wa-metric-label">{label}</span>
              <strong className="wa-metric-value">{value}</strong>
              <span className="wa-metric-sub">{sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ============================= GRID ============================ */}
      <div className="wa-grid">
        <div className="wa-col-main">
          {/* ---------------------- FUNDS SPLIT ---------------------- */}
          <div className="wa-card">
            <div className="wa-split-head">
              <h2 className="wa-card-title">Funds Breakdown</h2>
              <span className="wa-muted">
                {mask(`$${money(TOTAL_VALUE)}`)} total
              </span>
            </div>

            {/* One bar, two segments: what is free and what is reserved.
                Widths come from the same figures the metrics use. */}
            <div className="wa-split-bar">
              <span
                className="wa-split-free"
                style={{ width: `${(FREE_VALUE / TOTAL_VALUE) * 100}%` }}
              />
              <span
                className="wa-split-locked"
                style={{ width: `${(LOCKED_VALUE / TOTAL_VALUE) * 100}%` }}
              />
            </div>

            <div className="wa-split-legend">
              <div>
                <span className="wa-dot wa-dot--free" />
                <span className="wa-muted">Available</span>
                <b>{mask(`$${money(FREE_VALUE)}`)}</b>
              </div>
              <div>
                <span className="wa-dot wa-dot--locked" />
                <span className="wa-muted">In open orders</span>
                <b>{mask(`$${money(LOCKED_VALUE)}`)}</b>
              </div>
            </div>
          </div>

          {/* ------------------------ BALANCES ----------------------- */}
          <div className="wa-card">
            <div className="wa-toolbar">
              <div className="wa-tabs" role="tablist" aria-label="Filter balances">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === t.id}
                    className={`wa-tab ${tab === t.id ? "is-active" : ""}`}
                    onClick={() => setTab(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="wa-tools">
                <label className="wa-sort">
                  <ArrowUpDown size={13} />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    aria-label="Sort balances by"
                  >
                    {SORTS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="wa-search">
                  <Search size={14} />
                  <input
                    type="search"
                    value={query}
                    placeholder="Search asset..."
                    aria-label="Search balances"
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="wa-table-scroll">
              <table className="wa-table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th className="wa-num">Total</th>
                    <th className="wa-num">Available</th>
                    <th className="wa-num">In Orders</th>
                    <th className="wa-num">Price</th>
                    <th className="wa-num">Value</th>
                    <th>Allocation</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.sym}>
                      <td data-label="Asset" className="wa-cell-asset">
                        <CoinMark coinKey={row.key} sym={row.sym} />
                        <span className="wa-asset-text">
                          <b>{row.sym}</b>
                          <small>{row.name}</small>
                        </span>
                      </td>
                      <td data-label="Total" className="wa-num wa-strong">
                        {mask(qtyFmt(row.total))}
                      </td>
                      <td data-label="Available" className="wa-num">
                        {mask(qtyFmt(row.available))}
                      </td>
                      <td data-label="In Orders" className="wa-num">
                        {row.inOrders > 0 ? (
                          <span className="wa-locked">
                            <Lock size={10} />
                            {mask(qtyFmt(row.inOrders))}
                          </span>
                        ) : (
                          <span className="wa-muted">—</span>
                        )}
                      </td>
                      <td data-label="Price" className="wa-num wa-muted">
                        ${price(row.price)}
                      </td>
                      <td data-label="Value" className="wa-num wa-strong">
                        {mask(`$${money(row.value)}`)}
                      </td>
                      <td data-label="Allocation">
                        <span className="wa-alloc-cell">
                          <span className="wa-alloc-track">
                            <i
                              style={{
                                width: `${Math.max(3, (row.value / TOTAL_VALUE) * 100)}%`,
                                backgroundColor: COIN_COLORS[row.key],
                              }}
                            />
                          </span>
                          <small>
                            {((row.value / TOTAL_VALUE) * 100).toFixed(1)}%
                          </small>
                        </span>
                      </td>
                      <td data-label="Actions" className="wa-cell-actions">
                        <div className="wa-actions">
                          <button
                            type="button"
                            className="wa-mini-btn"
                            aria-label={`Deposit ${row.sym}`}
                          >
                            Deposit
                          </button>
                          <button
                            type="button"
                            className="wa-mini-btn"
                            aria-label={`Withdraw ${row.sym}`}
                          >
                            Withdraw
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {rows.length === 0 && (
                    <tr className="wa-empty-row">
                      <td colSpan={8}>
                        <div className="wa-empty">
                          <WalletIcon size={20} />
                          <p>No assets match this filter.</p>
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
        <aside className="wa-side">
          <div className="wa-card">
            <h2 className="wa-card-title">Balance Allocation</h2>

            <div className="wa-alloc">
              <div className="wa-donut">
                <Doughnut data={doughnutData} options={doughnutOptions} />
                <div className="wa-donut-center">
                  <strong>{mask(`$${money(TOTAL_VALUE, 0)}`)}</strong>
                  <span>Total</span>
                </div>
              </div>

              <ul className="wa-legend">
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

          <div className="wa-card">
            <h2 className="wa-card-title">
              <History size={14} /> Recent Activity
            </h2>

            <ul className="wa-tx-list">
              {TRANSACTIONS.map((tx) => {
                const isDeposit = tx.type === "Deposit";
                return (
                  <li key={tx.id}>
                    <span
                      className={`wa-tx-icon ${isDeposit ? "is-in" : "is-out"}`}
                    >
                      {isDeposit ? (
                        <ArrowDownCircle size={14} />
                      ) : (
                        <ArrowUpCircle size={14} />
                      )}
                    </span>
                    <span className="wa-tx-body">
                      <b>
                        {tx.type} {tx.sym}
                      </b>
                      <small>{tx.time}</small>
                    </span>
                    <span className="wa-tx-right">
                      <b className={isDeposit ? "wa-up" : "wa-down"}>
                        {isDeposit ? "+" : "-"}
                        {mask(qtyFmt(tx.amount))}
                      </b>
                      <small
                        className={
                          tx.status === "Completed" ? "wa-muted" : "wa-warn"
                        }
                      >
                        {tx.status === "Completed" ? (
                          <CheckCircle2 size={10} />
                        ) : (
                          <Clock size={10} />
                        )}
                        {tx.status}
                      </small>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="wa-card">
            <h2 className="wa-card-title">
              <ShieldCheck size={14} /> Deposit Address
            </h2>

            <p className="wa-deposit-note">
              Send only supported assets to this address. Anything else is
              permanently lost.
            </p>

            <div className="wa-address">
              <code>{DEPOSIT_ADDRESS}</code>
              <button
                type="button"
                className="wa-copy"
                onClick={() => {
                  setCopied(true);
                  // Revert the confirmation so the button does not stay stuck
                  // reading "Copied" after the user moves on
                  window.setTimeout(() => setCopied(false), 1600);
                }}
                aria-label="Copy deposit address"
              >
                {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <dl className="wa-summary">
              <div>
                <dt>Network</dt>
                <dd>ERC-20</dd>
              </div>
              <div>
                <dt>Min. Deposit</dt>
                <dd>10 USDT</dd>
              </div>
              <div>
                <dt>Confirmations</dt>
                <dd>12 blocks</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default Wallet;
