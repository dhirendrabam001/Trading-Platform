import { Fragment, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import {
  Layers,
  Search,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  ChevronDown,
  Target,
  AlertTriangle,
  ShieldCheck,
  Wallet,
  Percent,
  Download,
  X,
} from "lucide-react";
import "./OpenPosition.css";
import useChartTheme from "../../utils/chartTheme";

ChartJS.register(ArcElement, ChartTooltip);

/* ================================================================== data ===
   Only the raw facts of each position are stored - side, size, entry, mark,
   leverage, margin. Everything a trader reads (notional, unrealised P&L, ROE,
   distance to liquidation) is DERIVED below, so the table can never show a
   P&L that disagrees with its own entry and mark price. */

const POSITIONS = [
  { id: "p1", pair: "BTC / USDT", sym: "B", key: "btc", side: "Long", leverage: 10, size: 0.485, entry: 65120.4, mark: 67245.8, liq: 59480.2, margin: 3158.34, tp: 71500, sl: 62800, opened: "2h 14m" },
  { id: "p2", pair: "ETH / USDT", sym: "E", key: "eth", side: "Long", leverage: 5, size: 6.24, entry: 3402.15, mark: 3512.75, liq: 2790.5, margin: 4245.9, tp: 3800, sl: 3260, opened: "6h 02m" },
  { id: "p3", pair: "SOL / USDT", sym: "S", key: "sol", side: "Short", leverage: 8, size: 128.5, entry: 148.9, mark: 142.35, liq: 168.42, margin: 2286.1, tp: 132, sl: 156, opened: "1h 38m" },
  { id: "p4", pair: "XRP / USDT", sym: "X", key: "xrp", side: "Long", leverage: 3, size: 18400, entry: 0.6212, mark: 0.5987, liq: 0.4285, margin: 3670.2, tp: 0.71, sl: 0.55, opened: "1d 04h" },
  { id: "p5", pair: "BNB / USDT", sym: "B", key: "bnb", side: "Short", leverage: 6, size: 14.2, entry: 618.4, mark: 602.45, liq: 702.9, margin: 1426.2, tp: 572, sl: 646, opened: "4h 51m" },
  { id: "p6", pair: "AVAX / USDT", sym: "A", key: "avax", side: "Long", leverage: 12, size: 210, entry: 33.18, mark: 35.42, liq: 30.62, margin: 620.1, tp: 41.5, sl: 31.9, opened: "22m" },
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
};

const TABS = [
  { id: "all", label: "All Positions" },
  { id: "long", label: "Long" },
  { id: "short", label: "Short" },
  { id: "risk", label: "At Risk" },
];

const SORTS = [
  { id: "pnl", label: "Unrealised P&L" },
  { id: "roe", label: "ROE" },
  { id: "notional", label: "Position Size" },
  { id: "risk", label: "Liquidation Risk" },
];

/* A position is flagged once the mark price sits within this much of its
   liquidation price - the threshold the "At Risk" tab and the row warning
   both read from, so they can never disagree. */
const RISK_THRESHOLD = 12;

/* ============================================================== derived ===*/

const derive = (position) => {
  const { side, size, entry, mark, margin, liq } = position;
  const notional = size * mark;
  // Long profits as the mark rises, short as it falls
  const pnl = side === "Long" ? (mark - entry) * size : (entry - mark) * size;
  const roe = margin > 0 ? (pnl / margin) * 100 : 0;
  // How far the mark can travel before liquidation, as a share of the mark
  const liqDistance = mark > 0 ? (Math.abs(mark - liq) / mark) * 100 : 0;

  return {
    ...position,
    notional,
    pnl,
    roe,
    liqDistance,
    atRisk: liqDistance < RISK_THRESHOLD,
  };
};

const ROWS = POSITIONS.map(derive);

/* =============================================================== format ===*/

const money = (value, dp = 2) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });

/* Sub-dollar assets need significant digits, not two decimals: $0.5987 must
   not round away to $0.60 */
const price = (value) => (value >= 1 ? money(value) : `${value.toPrecision(4)}`);

const signed = (value, dp = 2) =>
  `${value >= 0 ? "+" : "-"}$${money(Math.abs(value), dp)}`;

/* ============================================================ components ===*/

const CoinMark = ({ coinKey, sym, size }) => (
  <span
    className={`op-coin${size ? ` op-coin--${size}` : ""}`}
    style={{ backgroundColor: COIN_COLORS[coinKey] || "#6b7280" }}
    aria-hidden="true"
  >
    {sym}
  </span>
);

const Pnl = ({ value, pct }) => {
  const up = value >= 0;
  return (
    <span className={`op-pnl ${up ? "is-up" : "is-down"}`}>
      <b>{signed(value)}</b>
      <small>
        {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
        {up ? "+" : ""}
        {pct.toFixed(2)}%
      </small>
    </span>
  );
};

/* Distance-to-liquidation meter. The fill is the SAFE portion, so a short bar
   reads as danger the same way a draining battery does. */
const RiskMeter = ({ distance }) => {
  const safe = Math.max(0, Math.min(100, distance * 4)); // 25% away = full bar
  const tone = distance < RISK_THRESHOLD ? "is-danger" : distance < 25 ? "is-warn" : "is-safe";

  return (
    <span className={`op-risk ${tone}`}>
      <span className="op-risk-track">
        <span className="op-risk-fill" style={{ width: `${safe}%` }} />
      </span>
      <small>{distance.toFixed(1)}%</small>
    </span>
  );
};

/* ============================================================= component ===*/

const OpenPosition = () => {
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("pnl");
  const [expanded, setExpanded] = useState(null);
  const [closed, setClosed] = useState([]);

  const chart = useChartTheme();

  const live = useMemo(() => ROWS.filter((r) => !closed.includes(r.id)), [closed]);

  /* Totals come from the live rows, so closing a position updates every
     figure on the page at once rather than leaving the summary stale. */
  const totals = useMemo(() => {
    const notional = live.reduce((sum, r) => sum + r.notional, 0);
    const pnl = live.reduce((sum, r) => sum + r.pnl, 0);
    const margin = live.reduce((sum, r) => sum + r.margin, 0);
    return {
      notional,
      pnl,
      margin,
      roe: margin > 0 ? (pnl / margin) * 100 : 0,
      // Equity is margin plus open profit; the ratio is what an exchange
      // would show as account health
      health: margin > 0 ? ((margin + pnl) / margin) * 100 : 0,
      atRisk: live.filter((r) => r.atRisk).length,
    };
  }, [live]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();

    return live
      .filter((r) => {
        if (q && !r.pair.toLowerCase().includes(q)) return false;
        if (tab === "long") return r.side === "Long";
        if (tab === "short") return r.side === "Short";
        if (tab === "risk") return r.atRisk;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "roe") return b.roe - a.roe;
        if (sortBy === "notional") return b.notional - a.notional;
        // Riskiest first means the SMALLEST distance to liquidation
        if (sortBy === "risk") return a.liqDistance - b.liqDistance;
        return b.pnl - a.pnl;
      });
  }, [live, tab, query, sortBy]);

  const allocation = useMemo(
    () =>
      [...live]
        .sort((a, b) => b.notional - a.notional)
        .map((r) => ({
          label: r.pair.split(" ")[0],
          value: r.notional,
          pct: totals.notional > 0 ? (r.notional / totals.notional) * 100 : 0,
          color: COIN_COLORS[r.key],
        })),
    [live, totals.notional],
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
      key: "value",
      icon: Layers,
      label: "Position Value",
      value: `$${money(totals.notional)}`,
      sub: `${live.length} open position${live.length === 1 ? "" : "s"}`,
      tone: "neutral",
    },
    {
      key: "pnl",
      icon: totals.pnl >= 0 ? TrendingUp : TrendingDown,
      label: "Unrealised P&L",
      value: signed(totals.pnl),
      sub: `${totals.roe >= 0 ? "+" : ""}${totals.roe.toFixed(2)}% on margin`,
      tone: totals.pnl >= 0 ? "up" : "down",
    },
    {
      key: "margin",
      icon: Wallet,
      label: "Margin Used",
      value: `$${money(totals.margin)}`,
      sub: "Cross margin",
      tone: "neutral",
    },
    {
      key: "health",
      icon: totals.atRisk > 0 ? AlertTriangle : ShieldCheck,
      label: "Account Health",
      value: `${totals.health.toFixed(1)}%`,
      sub:
        totals.atRisk > 0
          ? `${totals.atRisk} near liquidation`
          : "All positions clear",
      tone: totals.atRisk > 0 ? "down" : "up",
    },
  ];

  return (
    <section className="op-page">
      {/* ============================ HEADER =========================== */}
      <header className="op-header">
        <div className="op-heading">
          <span className="op-heading-icon">
            <Layers size={19} />
          </span>
          <div>
            <h1 className="op-title">Open Positions</h1>
            <p className="op-subtitle">
              Monitor exposure, margin health and unrealised performance in
              real time.
            </p>
          </div>
        </div>

        <div className="op-header-actions">
          <button type="button" className="op-btn op-btn--ghost">
            <Download size={14} /> Export
          </button>
          <button
            type="button"
            className="op-btn op-btn--danger"
            onClick={() => setClosed(ROWS.map((r) => r.id))}
            disabled={live.length === 0}
          >
            <X size={14} /> Close All
          </button>
        </div>
      </header>

      {/* ============================ METRICS ========================== */}
      <div className="op-metrics">
        {metrics.map(({ key, icon: Icon, label, value, sub, tone }) => (
          <div className={`op-card op-metric is-${tone}`} key={key}>
            <span className="op-metric-icon">
              <Icon size={16} />
            </span>
            <div className="op-metric-body">
              <span className="op-metric-label">{label}</span>
              <strong className="op-metric-value">{value}</strong>
              <span className="op-metric-sub">{sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ============================= GRID ============================ */}
      <div className="op-grid">
        {/* ------------------------- POSITIONS ------------------------ */}
        <div className="op-card op-table-card">
          <div className="op-toolbar">
            <div className="op-tabs" role="tablist" aria-label="Filter positions">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  className={`op-tab ${tab === t.id ? "is-active" : ""}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                  {t.id === "risk" && totals.atRisk > 0 && (
                    <i className="op-tab-dot" aria-hidden="true" />
                  )}
                </button>
              ))}
            </div>

            <div className="op-tools">
              <label className="op-sort">
                <ArrowUpDown size={13} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort positions by"
                >
                  {SORTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="op-search">
                <Search size={14} />
                <input
                  type="search"
                  value={query}
                  placeholder="Search pair..."
                  aria-label="Search positions"
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="op-table-scroll">
            <table className="op-table">
              <thead>
                <tr>
                  <th>Pair</th>
                  <th>Side</th>
                  <th className="op-num">Size</th>
                  <th className="op-num">Entry</th>
                  <th className="op-num">Mark</th>
                  <th className="op-num">Liq. Price</th>
                  <th className="op-num">Margin</th>
                  <th className="op-num">Unrealised P&amp;L</th>
                  <th>Liq. Distance</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <Fragment key={row.id}>
                    <tr
                      className={`${row.atRisk ? "is-risky" : ""} ${expanded === row.id ? "is-open" : ""}`}
                    >
                      <td data-label="Pair" className="op-cell-pair">
                        <CoinMark coinKey={row.key} sym={row.sym} />
                        <span className="op-pair-text">
                          <b>{row.pair}</b>
                          <small>{row.leverage}x · {row.opened}</small>
                        </span>
                      </td>
                      <td data-label="Side">
                        <span
                          className={`op-side ${row.side === "Long" ? "is-long" : "is-short"}`}
                        >
                          {row.side}
                        </span>
                      </td>
                      <td data-label="Size" className="op-num">
                        {money(row.size, row.size < 10 ? 4 : 2)}
                      </td>
                      <td data-label="Entry" className="op-num">
                        {price(row.entry)}
                      </td>
                      <td data-label="Mark" className="op-num op-strong">
                        {price(row.mark)}
                      </td>
                      <td data-label="Liq. Price" className="op-num op-down">
                        {price(row.liq)}
                      </td>
                      <td data-label="Margin" className="op-num">
                        ${money(row.margin)}
                      </td>
                      <td data-label="Unrealised P&L" className="op-num">
                        <Pnl value={row.pnl} pct={row.roe} />
                      </td>
                      <td data-label="Liq. Distance">
                        <RiskMeter distance={row.liqDistance} />
                      </td>
                      <td data-label="Actions" className="op-cell-actions">
                        <div className="op-actions">
                          <button
                            type="button"
                            className="op-icon-btn"
                            aria-expanded={expanded === row.id}
                            aria-label={`Details for ${row.pair}`}
                            onClick={() =>
                              setExpanded(expanded === row.id ? null : row.id)
                            }
                          >
                            <ChevronDown
                              size={14}
                              className={expanded === row.id ? "is-flipped" : ""}
                            />
                          </button>
                          <button
                            type="button"
                            className="op-close-btn"
                            onClick={() => setClosed((c) => [...c, row.id])}
                          >
                            Close
                          </button>
                        </div>
                      </td>
                    </tr>

                    {expanded === row.id && (
                      <tr className="op-detail-row">
                        <td colSpan={10}>
                          <div className="op-detail">
                            <div className="op-detail-block">
                              <span className="op-detail-label">
                                <Target size={12} /> Take Profit
                              </span>
                              <b className="op-up">{price(row.tp)}</b>
                              <small>
                                {(
                                  ((row.side === "Long" ? row.tp - row.mark : row.mark - row.tp) /
                                    row.mark) *
                                  100
                                ).toFixed(2)}
                                % away
                              </small>
                            </div>

                            <div className="op-detail-block">
                              <span className="op-detail-label">
                                <AlertTriangle size={12} /> Stop Loss
                              </span>
                              <b className="op-down">{price(row.sl)}</b>
                              <small>
                                {(
                                  ((row.side === "Long" ? row.mark - row.sl : row.sl - row.mark) /
                                    row.mark) *
                                  100
                                ).toFixed(2)}
                                % away
                              </small>
                            </div>

                            <div className="op-detail-block">
                              <span className="op-detail-label">
                                <Layers size={12} /> Notional
                              </span>
                              <b>${money(row.notional)}</b>
                              <small>{row.leverage}x leverage</small>
                            </div>

                            <div className="op-detail-block">
                              <span className="op-detail-label">
                                <Percent size={12} /> Return on Equity
                              </span>
                              <b className={row.roe >= 0 ? "op-up" : "op-down"}>
                                {row.roe >= 0 ? "+" : ""}
                                {row.roe.toFixed(2)}%
                              </b>
                              <small>on ${money(row.margin)} margin</small>
                            </div>

                            <div className="op-detail-actions">
                              <button type="button" className="op-btn op-btn--ghost">
                                Edit TP / SL
                              </button>
                              <button type="button" className="op-btn op-btn--ghost">
                                Add Margin
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}

                {rows.length === 0 && (
                  <tr className="op-empty-row">
                    <td colSpan={10}>
                      <div className="op-empty">
                        <Layers size={20} />
                        <p>
                          {live.length === 0
                            ? "No open positions. Your closed positions move to Orders History."
                            : "No positions match this filter."}
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
        <aside className="op-side">
          <div className="op-card">
            <h2 className="op-card-title">Exposure by Asset</h2>

            {allocation.length > 0 ? (
              <div className="op-alloc">
                <div className="op-donut">
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                  <div className="op-donut-center">
                    <strong>${money(totals.notional, 0)}</strong>
                    <span>Total Exposure</span>
                  </div>
                </div>

                <ul className="op-legend">
                  {allocation.map((slice) => (
                    <li key={slice.label}>
                      <i style={{ backgroundColor: slice.color }} />
                      <span>{slice.label}</span>
                      <b>{slice.pct.toFixed(1)}%</b>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="op-muted op-alloc-empty">Nothing open to allocate.</p>
            )}
          </div>

          <div className="op-card">
            <h2 className="op-card-title">Risk Overview</h2>

            <div className="op-health">
              <div className="op-health-top">
                <span className="op-muted">Account Health</span>
                <b className={totals.health >= 100 ? "op-up" : "op-down"}>
                  {totals.health.toFixed(1)}%
                </b>
              </div>
              {/* Capped at 150% so a strong account still shows a readable bar
                  rather than a permanently full one */}
              <span className="op-health-track">
                <span
                  className={`op-health-fill ${totals.health >= 100 ? "is-safe" : "is-warn"}`}
                  style={{
                    width: `${Math.max(4, Math.min(100, (totals.health / 150) * 100))}%`,
                  }}
                />
              </span>
            </div>

            <dl className="op-risk-list">
              <div>
                <dt>Long Exposure</dt>
                <dd>
                  $
                  {money(
                    live
                      .filter((r) => r.side === "Long")
                      .reduce((s, r) => s + r.notional, 0),
                  )}
                </dd>
              </div>
              <div>
                <dt>Short Exposure</dt>
                <dd>
                  $
                  {money(
                    live
                      .filter((r) => r.side === "Short")
                      .reduce((s, r) => s + r.notional, 0),
                  )}
                </dd>
              </div>
              <div>
                <dt>Positions at Risk</dt>
                <dd className={totals.atRisk > 0 ? "op-down" : "op-up"}>
                  {totals.atRisk}
                </dd>
              </div>
              <div>
                <dt>Avg. Leverage</dt>
                <dd>
                  {live.length
                    ? (
                        live.reduce((s, r) => s + r.leverage, 0) / live.length
                      ).toFixed(1)
                    : "0.0"}
                  x
                </dd>
              </div>
            </dl>
          </div>

          <div className="op-card op-pnl-card">
            <h2 className="op-card-title">P&amp;L by Position</h2>

            {live.length > 0 ? (
              <ul className="op-pnl-list">
                {[...live]
                  .sort((a, b) => b.pnl - a.pnl)
                  .map((row) => {
                    // Bars are scaled against the largest absolute P&L so the
                    // biggest mover fills the row and the rest stay relative
                    const peak = Math.max(
                      ...live.map((r) => Math.abs(r.pnl)),
                      1,
                    );
                    const width = (Math.abs(row.pnl) / peak) * 100;

                    return (
                      <li key={row.id}>
                        <span className="op-pnl-pair">
                          <CoinMark coinKey={row.key} sym={row.sym} size="sm" />
                          {row.pair.split(" ")[0]}
                        </span>
                        <span className="op-pnl-bar">
                          <i
                            className={row.pnl >= 0 ? "is-up" : "is-down"}
                            style={{ width: `${width}%` }}
                          />
                        </span>
                        <b className={row.pnl >= 0 ? "op-up" : "op-down"}>
                          {signed(row.pnl, 0)}
                        </b>
                      </li>
                    );
                  })}
              </ul>
            ) : (
              <p className="op-muted">No open positions.</p>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
};

export default OpenPosition;
