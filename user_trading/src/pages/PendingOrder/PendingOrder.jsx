import { Fragment, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import {
  Clock,
  Search,
  ArrowUpDown,
  ChevronDown,
  X,
  Download,
  TrendingUp,
  TrendingDown,
  Target,
  Timer,
  Wallet,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Pencil,
} from "lucide-react";
import "./PendingOrder.css";
import useChartTheme from "../../utils/chartTheme";

ChartJS.register(ArcElement, ChartTooltip);

const ORDERS = [
  {
    id: "o1",
    pair: "BTC / USDT",
    sym: "B",
    key: "btc",
    side: "Buy",
    type: "Limit",
    trigger: 65800.0,
    mark: 67245.8,
    amount: 0.125,
    filled: 0.0,
    tif: "GTC",
    placed: "12 Aug, 09:41",
    expires: "GTC",
    postOnly: true,
  },
  {
    id: "o2",
    pair: "ETH / USDT",
    sym: "E",
    key: "eth",
    side: "Sell",
    type: "Limit",
    trigger: 3620.0,
    mark: 3512.75,
    amount: 2.5,
    filled: 0.5,
    tif: "GTC",
    placed: "12 Aug, 08:12",
    expires: "GTC",
    postOnly: false,
  },
  /* A BUY stop rests ABOVE the mark - it is a breakout entry, not a discount
     bid. (A sell stop-loss, o6, correctly rests below.) */
  {
    id: "o3",
    pair: "SOL / USDT",
    sym: "S",
    key: "sol",
    side: "Buy",
    type: "Stop Limit",
    trigger: 145.9,
    mark: 142.35,
    amount: 46.0,
    filled: 0.0,
    tif: "GTC",
    placed: "12 Aug, 07:55",
    expires: "3d 04h",
    postOnly: false,
  },
  {
    id: "o4",
    pair: "XRP / USDT",
    sym: "X",
    key: "xrp",
    side: "Sell",
    type: "Take Profit",
    trigger: 0.71,
    mark: 0.5987,
    amount: 12500,
    filled: 0.0,
    tif: "GTC",
    placed: "11 Aug, 22:18",
    expires: "GTC",
    postOnly: false,
  },
  {
    id: "o5",
    pair: "BNB / USDT",
    sym: "B",
    key: "bnb",
    side: "Buy",
    type: "Limit",
    trigger: 596.2,
    mark: 602.45,
    amount: 8.0,
    filled: 3.2,
    tif: "IOC",
    placed: "12 Aug, 10:02",
    expires: "6h 12m",
    postOnly: false,
  },
  {
    id: "o6",
    pair: "AVAX / USDT",
    sym: "A",
    key: "avax",
    side: "Sell",
    type: "Stop Loss",
    trigger: 33.9,
    mark: 35.42,
    amount: 140,
    filled: 0.0,
    tif: "GTC",
    placed: "12 Aug, 10:31",
    expires: "GTC",
    postOnly: false,
  },
  {
    id: "o7",
    pair: "LINK / USDT",
    sym: "L",
    key: "link",
    side: "Buy",
    type: "Limit",
    trigger: 15.1,
    mark: 16.25,
    amount: 320,
    filled: 0.0,
    tif: "GTC",
    placed: "11 Aug, 19:44",
    expires: "1d 08h",
    postOnly: true,
  },
  {
    id: "o8",
    pair: "ADA / USDT",
    sym: "A",
    key: "ada",
    side: "Buy",
    type: "Limit",
    trigger: 0.441,
    mark: 0.4567,
    amount: 9800,
    filled: 2450,
    tif: "GTC",
    placed: "12 Aug, 06:07",
    expires: "GTC",
    postOnly: false,
  },
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
};

/* Order types get their own hue so the doughnut, the legend and the row
   badges all read from one source.
   hex feeds Chart.js, which needs a literal colour string. rgb feeds the
   badge, which mixes its own alphas in CSS - the same rgb-triplet pattern the
   rest of the app uses for --accent-rgb / --down-rgb, and one that does not
   depend on color-mix() support. */
const TYPE_COLORS = {
  Limit: { hex: "#00c281", rgb: "0, 194, 129" },
  "Stop Limit": { hex: "#f59e0b", rgb: "245, 158, 11" },
  "Take Profit": { hex: "#3b82f6", rgb: "59, 130, 246" },
  "Stop Loss": { hex: "#e84142", rgb: "232, 65, 66" },
};

const TABS = [
  { id: "all", label: "All Orders" },
  { id: "buy", label: "Buy" },
  { id: "sell", label: "Sell" },
  { id: "near", label: "Near Trigger" },
];

const SORTS = [
  { id: "distance", label: "Closest to Trigger" },
  { id: "value", label: "Order Value" },
  { id: "filled", label: "Fill Progress" },
  { id: "placed", label: "Newest First" },
];

/* An order is "near trigger" once the mark sits within this much of it. The
   tab, the row highlight and the metric all read this one number, so they
   can never disagree. */
const NEAR_THRESHOLD = 3;

/* ============================================================== derived ===*/

const derive = (order) => {
  const { trigger, mark, amount, filled } = order;
  const value = trigger * amount;
  const fillPct = amount > 0 ? (filled / amount) * 100 : 0;
  // How far the mark still has to travel, as a share of the mark
  const distance = mark > 0 ? ((trigger - mark) / mark) * 100 : 0;

  return {
    ...order,
    value,
    fillPct,
    distance,
    absDistance: Math.abs(distance),
    near: Math.abs(distance) <= NEAR_THRESHOLD,
    partial: filled > 0 && filled < amount,
  };
};

const ROWS = ORDERS.map(derive);

/* =============================================================== format ===*/

const money = (value, dp = 2) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });

/* Sub-dollar assets need significant digits, not two decimals: $0.4410 must
   not round away to $0.44 */
const price = (value) => (value >= 1 ? money(value) : value.toPrecision(4));

const qty = (value) => money(value, value < 10 ? 4 : value < 1000 ? 2 : 0);

/* ============================================================ components ===*/

const CoinMark = ({ coinKey, sym, size }) => (
  <span
    className={`po-coin${size ? ` po-coin--${size}` : ""}`}
    style={{ backgroundColor: COIN_COLORS[coinKey] || "#6b7280" }}
    aria-hidden="true"
  >
    {sym}
  </span>
);

/* Distance the mark still has to move for the order to trigger. The sign
   matters: a buy limit sits BELOW the mark, a sell limit above, so the arrow
   shows which way the market needs to go. */
const Distance = ({ value, near }) => {
  const up = value >= 0;
  return (
    <span className={`po-distance ${near ? "is-near" : ""}`}>
      {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {up ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  );
};

const FillBar = ({ pct }) => (
  <span className="po-fill">
    <span className="po-fill-track">
      <span
        className={`po-fill-bar ${pct > 0 ? "is-partial" : ""}`}
        style={{ width: `${Math.max(pct > 0 ? 4 : 0, Math.min(100, pct))}%` }}
      />
    </span>
    <small>{pct.toFixed(0)}%</small>
  </span>
);

/* ============================================================= component ===*/

const PendingOrder = () => {
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("distance");
  const [expanded, setExpanded] = useState(null);
  const [cancelled, setCancelled] = useState([]);

  const chart = useChartTheme();

  const live = useMemo(
    () => ROWS.filter((r) => !cancelled.includes(r.id)),
    [cancelled],
  );

  /* Totals read from the live rows, so cancelling an order updates every
     figure on the page at once rather than leaving the summary stale. */
  const totals = useMemo(() => {
    const value = live.reduce((sum, r) => sum + r.value, 0);
    const reserved = live
      .filter((r) => r.side === "Buy")
      .reduce((sum, r) => sum + r.value * (1 - r.fillPct / 100), 0);
    const nearest = live.reduce(
      (best, r) => (r.absDistance < best ? r.absDistance : best),
      Infinity,
    );

    return {
      value,
      reserved,
      near: live.filter((r) => r.near).length,
      partial: live.filter((r) => r.partial).length,
      // Infinity would print as "∞%" once the last order is cancelled
      nearest: Number.isFinite(nearest) ? nearest : 0,
    };
  }, [live]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();

    return live
      .filter((r) => {
        if (q && !`${r.pair} ${r.type}`.toLowerCase().includes(q)) return false;
        if (tab === "buy") return r.side === "Buy";
        if (tab === "sell") return r.side === "Sell";
        if (tab === "near") return r.near;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "value") return b.value - a.value;
        if (sortBy === "filled") return b.fillPct - a.fillPct;
        if (sortBy === "placed") return b.placed.localeCompare(a.placed);
        // Closest to trigger first, regardless of direction
        return a.absDistance - b.absDistance;
      });
  }, [live, tab, query, sortBy]);

  /* Group by order type for the doughnut */
  const byType = useMemo(() => {
    const groups = new Map();
    for (const row of live) {
      groups.set(row.type, (groups.get(row.type) || 0) + 1);
    }
    return [...groups.entries()]
      .map(([type, count]) => ({
        type,
        count,
        pct: live.length > 0 ? (count / live.length) * 100 : 0,
        color: TYPE_COLORS[type]?.hex || "#6b7280",
      }))
      .sort((a, b) => b.count - a.count);
  }, [live]);

  const doughnutData = {
    labels: byType.map((t) => t.type),
    datasets: [
      {
        data: byType.map((t) => t.count),
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
        callbacks: {
          label: (item) =>
            `${item.parsed} order${item.parsed === 1 ? "" : "s"}`,
        },
      },
    },
  };

  const metrics = [
    {
      key: "count",
      icon: Clock,
      label: "Pending Orders",
      value: String(live.length),
      sub:
        totals.partial > 0
          ? `${totals.partial} partially filled`
          : "None partially filled",
      tone: "neutral",
    },
    {
      key: "value",
      icon: Layers,
      label: "Total Order Value",
      value: `$${money(totals.value)}`,
      sub: "Across all pending orders",
      tone: "neutral",
    },
    {
      key: "reserved",
      icon: Wallet,
      label: "Reserved Funds",
      value: `$${money(totals.reserved)}`,
      sub: "Locked by open buy orders",
      tone: "neutral",
    },
    {
      key: "near",
      icon: totals.near > 0 ? AlertTriangle : CheckCircle2,
      label: "Near Trigger",
      value: String(totals.near),
      sub:
        live.length > 0
          ? `Closest is ${totals.nearest.toFixed(2)}% away`
          : "No pending orders",
      tone: totals.near > 0 ? "warn" : "up",
    },
  ];

  return (
    <section className="po-page">
      {/* ============================ HEADER =========================== */}
      <header className="po-header">
        <div className="po-heading">
          <span className="po-heading-icon">
            <Clock size={19} />
          </span>
          <div>
            <h1 className="po-title">Pending Orders</h1>
            <p className="po-subtitle">
              Orders waiting to trigger. Track distance to fill, reserved funds
              and expiry in one place.
            </p>
          </div>
        </div>

        <div className="po-header-actions">
          <button type="button" className="po-btn po-btn--ghost">
            <Download size={14} /> Export
          </button>
          <button
            type="button"
            className="po-btn po-btn--danger"
            onClick={() => setCancelled(ROWS.map((r) => r.id))}
            disabled={live.length === 0}
          >
            <X size={14} /> Cancel All
          </button>
        </div>
      </header>

      {/* ============================ METRICS ========================== */}
      <div className="po-metrics">
        {metrics.map(({ key, icon: Icon, label, value, sub, tone }) => (
          <div className={`po-card po-metric is-${tone}`} key={key}>
            <span className="po-metric-icon">
              <Icon size={16} />
            </span>
            <div className="po-metric-body">
              <span className="po-metric-label">{label}</span>
              <strong className="po-metric-value">{value}</strong>
              <span className="po-metric-sub">{sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ============================= GRID ============================ */}
      <div className="po-grid">
        {/* --------------------------- ORDERS ------------------------- */}
        <div className="po-card">
          <div className="po-toolbar">
            <div className="po-tabs" role="tablist" aria-label="Filter orders">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  className={`po-tab ${tab === t.id ? "is-active" : ""}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                  {t.id === "near" && totals.near > 0 && (
                    <i className="po-tab-dot" aria-hidden="true" />
                  )}
                </button>
              ))}
            </div>

            <div className="po-tools">
              <label className="po-sort">
                <ArrowUpDown size={13} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort orders by"
                >
                  {SORTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="po-search">
                <Search size={14} />
                <input
                  type="search"
                  value={query}
                  placeholder="Search pair or type..."
                  aria-label="Search pending orders"
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="po-table-scroll">
            <table className="po-table">
              <thead>
                <tr>
                  <th>Pair</th>
                  <th>Type</th>
                  <th>Side</th>
                  <th className="po-num">Trigger</th>
                  <th className="po-num">Mark</th>
                  <th className="po-num">Amount</th>
                  <th className="po-num">Order Value</th>
                  <th>Filled</th>
                  <th className="po-num">To Trigger</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <Fragment key={row.id}>
                    <tr
                      className={`${row.near ? "is-near" : ""} ${expanded === row.id ? "is-open" : ""}`}
                    >
                      <td data-label="Pair" className="po-cell-pair">
                        <CoinMark coinKey={row.key} sym={row.sym} />
                        <span className="po-pair-text">
                          <b>{row.pair}</b>
                          <small>{row.placed}</small>
                        </span>
                      </td>
                      <td data-label="Type">
                        <span
                          className="po-type"
                          style={{ "--type-rgb": TYPE_COLORS[row.type]?.rgb }}
                        >
                          {row.type}
                        </span>
                      </td>
                      <td data-label="Side">
                        <span
                          className={`po-side ${row.side === "Buy" ? "is-buy" : "is-sell"}`}
                        >
                          {row.side}
                        </span>
                      </td>
                      <td data-label="Trigger" className="po-num po-strong">
                        {price(row.trigger)}
                      </td>
                      <td data-label="Mark" className="po-num po-muted">
                        {price(row.mark)}
                      </td>
                      <td data-label="Amount" className="po-num">
                        {qty(row.amount)}
                      </td>
                      <td data-label="Order Value" className="po-num">
                        ${money(row.value)}
                      </td>
                      <td data-label="Filled">
                        <FillBar pct={row.fillPct} />
                      </td>
                      <td data-label="To Trigger" className="po-num">
                        <Distance value={row.distance} near={row.near} />
                      </td>
                      <td data-label="Actions" className="po-cell-actions">
                        <div className="po-actions">
                          <button
                            type="button"
                            className="po-icon-btn"
                            aria-expanded={expanded === row.id}
                            aria-label={`Details for ${row.pair} order`}
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
                          <button
                            type="button"
                            className="po-cancel-btn"
                            onClick={() => setCancelled((c) => [...c, row.id])}
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>

                    {expanded === row.id && (
                      <tr className="po-detail-row">
                        <td colSpan={10}>
                          <div className="po-detail">
                            <div className="po-detail-block">
                              <span className="po-detail-label">
                                <Target size={12} /> Trigger Price
                              </span>
                              <b>{price(row.trigger)}</b>
                              <small>
                                Mark must move{" "}
                                {row.distance >= 0 ? "up" : "down"}{" "}
                                {Math.abs(row.distance).toFixed(2)}%
                              </small>
                            </div>

                            <div className="po-detail-block">
                              <span className="po-detail-label">
                                <Layers size={12} /> Remaining
                              </span>
                              <b>{qty(row.amount - row.filled)}</b>
                              <small>
                                of {qty(row.amount)} · {row.fillPct.toFixed(0)}%
                                filled
                              </small>
                            </div>

                            <div className="po-detail-block">
                              <span className="po-detail-label">
                                <Timer size={12} /> Time in Force
                              </span>
                              <b>{row.tif}</b>
                              <small>
                                {row.expires === "GTC"
                                  ? "No expiry"
                                  : `Expires in ${row.expires}`}
                              </small>
                            </div>

                            <div className="po-detail-block">
                              <span className="po-detail-label">
                                <CheckCircle2 size={12} /> Flags
                              </span>
                              <b>{row.postOnly ? "Post only" : "Standard"}</b>
                              <small>Order ID #{row.id.toUpperCase()}</small>
                            </div>

                            <div className="po-detail-actions">
                              <button
                                type="button"
                                className="po-btn po-btn--ghost"
                              >
                                <Pencil size={13} /> Edit Order
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}

                {rows.length === 0 && (
                  <tr className="po-empty-row">
                    <td colSpan={10}>
                      <div className="po-empty">
                        <Clock size={20} />
                        <p>
                          {live.length === 0
                            ? "No pending orders. Filled and cancelled orders move to Orders History."
                            : "No orders match this filter."}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* -------------------------- SIDE RAIL ----------------------- */}
        <aside className="po-side">
          <div className="po-card">
            <h2 className="po-card-title">Orders by Type</h2>

            {byType.length > 0 ? (
              <div className="po-alloc">
                <div className="po-donut">
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                  <div className="po-donut-center">
                    <strong>{live.length}</strong>
                    <span>Pending</span>
                  </div>
                </div>

                <ul className="po-legend">
                  {byType.map((slice) => (
                    <li key={slice.type}>
                      <i style={{ backgroundColor: slice.color }} />
                      <span>{slice.type}</span>
                      <b>{slice.count}</b>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="po-muted">Nothing pending.</p>
            )}
          </div>

          <div className="po-card">
            <h2 className="po-card-title">Closest to Trigger</h2>

            {live.length > 0 ? (
              <ul className="po-proximity">
                {[...live]
                  .sort((a, b) => a.absDistance - b.absDistance)
                  .slice(0, 5)
                  .map((row) => {
                    /* Bars are scaled so 10% away is empty and 0% is full -
                       the closer to trigger, the fuller the bar reads. */
                    const closeness = Math.max(
                      0,
                      Math.min(100, (1 - row.absDistance / 10) * 100),
                    );

                    return (
                      <li key={row.id}>
                        <span className="po-prox-pair">
                          <CoinMark coinKey={row.key} sym={row.sym} size="sm" />
                          {row.pair.split(" ")[0]}
                        </span>
                        <span className="po-prox-bar">
                          <i
                            className={row.near ? "is-near" : ""}
                            style={{ width: `${Math.max(4, closeness)}%` }}
                          />
                        </span>
                        <b className={row.near ? "po-warn" : "po-muted"}>
                          {row.absDistance.toFixed(2)}%
                        </b>
                      </li>
                    );
                  })}
              </ul>
            ) : (
              <p className="po-muted">Nothing pending.</p>
            )}
          </div>

          <div className="po-card">
            <h2 className="po-card-title">Order Summary</h2>

            <dl className="po-summary">
              <div>
                <dt>Buy Orders</dt>
                <dd className="po-up">
                  {live.filter((r) => r.side === "Buy").length}
                </dd>
              </div>
              <div>
                <dt>Sell Orders</dt>
                <dd className="po-down">
                  {live.filter((r) => r.side === "Sell").length}
                </dd>
              </div>
              <div>
                <dt>Partially Filled</dt>
                <dd>{totals.partial}</dd>
              </div>
              <div>
                <dt>Avg. Distance</dt>
                <dd>
                  {live.length
                    ? (
                        live.reduce((s, r) => s + r.absDistance, 0) /
                        live.length
                      ).toFixed(2)
                    : "0.00"}
                  %
                </dd>
              </div>
              <div>
                <dt>With Expiry</dt>
                <dd>{live.filter((r) => r.expires !== "GTC").length}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default PendingOrder;
