import { useMemo, useState } from "react";
import {
  useGetWalletBalancesQuery,
  useGetLedgerQuery,
} from "../../redux/api/tradingApi";
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

  /* ------------------------------------------------------ live data ---
     One hook each. RTK Query handles loading, errors and caching, and
     refetches on its own whenever a trade or transfer changes a balance. */
  const { data: walletData, isLoading } = useGetWalletBalancesQuery();
  const { data: ledgerData } = useGetLedgerQuery({ limit: 5 });

  /* The API returns { symbol, available, locked, ... }; this page was
     written around { sym, inOrders }. Renaming here keeps the rest of the
     component untouched. */
  const allRows = useMemo(() => {
    const balances = walletData?.balances ?? [];

    return balances
      .filter((b) => b.available + b.locked > 0)
      .map((b) =>
        derive({
          sym: b.symbol,
          name: b.name,
          key: b.key,
          available: b.available,
          inOrders: b.locked,
          // A missing price means the feed cannot value it right now. Zero
          // keeps the maths safe; the row still shows the real quantity.
          price: b.price ?? 0,
        }),
      );
  }, [walletData]);

  const totalValue = useMemo(
    () => allRows.reduce((sum, r) => sum + r.value, 0),
    [allRows],
  );
  const lockedTotal = useMemo(
    () => allRows.reduce((sum, r) => sum + r.lockedValue, 0),
    [allRows],
  );
  const freeValue = totalValue - lockedTotal;

  /* Account size quoted in BTC, the way an exchange shows it */
  const btcPrice = allRows.find((r) => r.sym === "BTC")?.price || 0;

  /* Last few transfers for the side panel */
  const transactions = useMemo(
    () =>
      (ledgerData?.entries ?? [])
        .filter((e) => e.type === "deposit" || e.type === "withdrawal")
        .map((e) => ({
          id: e._id,
          type: e.type === "deposit" ? "Deposit" : "Withdraw",
          sym: e.asset,
          key: e.asset.toLowerCase(),
          amount: Math.abs(e.availableDelta),
          status: "Completed",
          time: new Date(e.createdAt).toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          }),
        })),
    [ledgerData],
  );

  /* Privacy mode masks every figure in one place, so a balance cannot leak
     through a card that forgot to check the flag */
  const mask = (text) => (hidden ? "••••••" : text);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();

    return allRows.filter((r) => {
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
  }, [allRows, tab, query, sortBy]);

  const allocation = useMemo(
    () =>
      [...allRows]
        .sort((a, b) => b.value - a.value)
        .map((r) => ({
          label: r.sym,
          pct: totalValue > 0 ? (r.value / totalValue) * 100 : 0,
          color: COIN_COLORS[r.key],
        })),
    [allRows, totalValue],
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
      value: mask(`$${money(totalValue)}`),
      sub: mask(`≈ ${(totalValue / btcPrice).toFixed(4)} BTC`),
      tone: "neutral",
    },
    {
      key: "free",
      icon: CheckCircle2,
      label: "Available",
      value: mask(`$${money(freeValue)}`),
      sub: `${((freeValue / totalValue) * 100).toFixed(1)}% free to trade`,
      tone: "up",
    },
    {
      key: "locked",
      icon: Lock,
      label: "In Open Orders",
      value: mask(`$${money(lockedTotal)}`),
      sub: `${((lockedTotal / totalValue) * 100).toFixed(1)}% reserved`,
      tone: "warn",
    },
    {
      key: "assets",
      icon: ArrowLeftRight,
      label: "Assets Held",
      value: String(allRows.filter((r) => r.total > 0).length),
      sub: `${allRows.filter((r) => r.inOrders > 0).length} with open orders`,
      tone: "neutral",
    },
  ];


  // Shown while the first request is in flight, so the page never flashes
  // zeros and then jumps to real numbers.
  if (isLoading) {
    return (
      <section className="wa-page">
        <div className="wa-loading">Loading your wallet…</div>
      </section>
    );
  }

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
                {mask(`$${money(totalValue)}`)} total
              </span>
            </div>

            {/* One bar, two segments: what is free and what is reserved.
                Widths come from the same figures the metrics use. */}
            <div className="wa-split-bar">
              <span
                className="wa-split-free"
                style={{ width: `${(freeValue / totalValue) * 100}%` }}
              />
              <span
                className="wa-split-locked"
                style={{ width: `${(lockedTotal / totalValue) * 100}%` }}
              />
            </div>

            <div className="wa-split-legend">
              <div>
                <span className="wa-dot wa-dot--free" />
                <span className="wa-muted">Available</span>
                <b>{mask(`$${money(freeValue)}`)}</b>
              </div>
              <div>
                <span className="wa-dot wa-dot--locked" />
                <span className="wa-muted">In open orders</span>
                <b>{mask(`$${money(lockedTotal)}`)}</b>
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
                                width: `${Math.max(3, (row.value / totalValue) * 100)}%`,
                                backgroundColor: COIN_COLORS[row.key],
                              }}
                            />
                          </span>
                          <small>
                            {((row.value / totalValue) * 100).toFixed(1)}%
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
                  <strong>{mask(`$${money(totalValue, 0)}`)}</strong>
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
              {transactions.map((tx) => {
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
