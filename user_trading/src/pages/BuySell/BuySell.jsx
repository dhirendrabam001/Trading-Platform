import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Star,
  Info,
  Minus,
  Plus,
  ChevronDown,
  Search,
  Settings,
  Camera,
  Maximize2,
  BarChart3,
  CandlestickChart,
  ShieldCheck,
  Zap,
  Headphones,
  TrendingUp,
} from "lucide-react";
import "./BuySell.css";

/* ================================================================== data ===
   Static fixtures at module scope: rebuilding them per render would only
   hand React new identities for no benefit. */

const SYMBOL = { base: "BTC", quote: "USDT", name: "Bitcoin / Tether" };
const LAST_PRICE = 67245.8;
const BALANCE = 24562.34;
const FEE_RATE = 0.001;

const HEAD_STATS = [
  { label: "24h High", value: "68,214.50" },
  { label: "24h Low", value: "64,891.20" },
  { label: "24h Volume (BTC)", value: "32,451.32" },
  { label: "24h Volume (USDT)", value: "2.18B" },
];

const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1D"];
const ORDER_TYPES = ["Limit", "Market", "Stop Limit"];
const PERCENTS = [0, 25, 50, 75, 100];

const ASKS = [
  { price: 67248.9, amount: 0.4567, total: "30,732.45", depth: 62 },
  { price: 67248.05, amount: 0.3254, total: "21,887.65", depth: 44 },
  { price: 67247.2, amount: 0.2, total: "13,449.44", depth: 27 },
  { price: 67246.5, amount: 0.1503, total: "10,114.09", depth: 20 },
  { price: 67245.9, amount: 0.1256, total: "8,446.32", depth: 17 },
  { price: 67245.85, amount: 0.1, total: "6,724.58", depth: 13 },
];

const BIDS = [
  { price: 67245.7, amount: 0.1456, total: "9,803.08", depth: 20 },
  { price: 67244.9, amount: 0.2, total: "13,448.88", depth: 27 },
  { price: 67244.2, amount: 0.3, total: "20,173.26", depth: 41 },
  { price: 67243.1, amount: 0.4, total: "26,897.24", depth: 54 },
  { price: 67242.3, amount: 0.5, total: "33,621.5", depth: 68 },
  { price: 67241.0, amount: 0.65, total: "43,706.98", depth: 88 },
];

const RECENT_TRADES = [
  { price: 67245.8, amount: 0.025, time: "10:24:15", up: true },
  { price: 67245.7, amount: 0.0105, time: "10:24:12", up: true },
  { price: 67245.6, amount: 0.0352, time: "10:24:10", up: false },
  { price: 67245.8, amount: 0.015, time: "10:24:08", up: true },
  { price: 67245.7, amount: 0.02, time: "10:24:06", up: false },
  { price: 67245.6, amount: 0.04, time: "10:24:04", up: true },
  { price: 67245.5, amount: 0.01, time: "10:24:02", up: false },
];

const OPEN_ORDERS = [
  {
    pair: "BTC / USDT",
    type: "Limit",
    side: "Buy",
    price: "67,000.00",
    amount: "0.0250 BTC",
    filled: "0.0100 BTC",
    total: "1,675.00 USDT",
    status: "Partially Filled",
  },
  {
    pair: "ETH / USDT",
    type: "Limit",
    side: "Buy",
    price: "3,500.00",
    amount: "0.5000 ETH",
    filled: "0.0000 ETH",
    total: "1,750.00 USDT",
    status: "Open",
  },
  {
    pair: "BNB / USDT",
    type: "Limit",
    side: "Sell",
    price: "600.00",
    amount: "1.0000 BNB",
    filled: "0.0000 BNB",
    total: "600.00 USDT",
    status: "Open",
  },
];

const ORDER_TABS = ["Open Orders", "Order History", "Trade History"];

const ASSURANCES = [
  {
    icon: ShieldCheck,
    title: "Secure Trading",
    copy: "256-bit SSL Protection",
  },
  {
    icon: Zap,
    title: "Fast Execution",
    copy: "Orders executed in milliseconds",
  },
  { icon: Headphones, title: "24/7 Support", copy: "We're here to help you" },
];

/* ============================================================== candles ===
   Seeded so the series is stable across renders - an unseeded Math.random()
   would redraw a different chart on every keystroke in the ticket. Each
   timeframe seeds differently, so switching 15m -> 1h genuinely changes the
   shape rather than relabelling the same candles. */

const mulberry32 = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const buildCandles = (seed, count = 64) => {
  const random = mulberry32(seed);
  const candles = [];
  let price = 66000;

  for (let i = 0; i < count; i++) {
    const open = price;
    // Slight upward bias so the series ends near the quoted price without
    // needing a large corrective shift at the end
    const move = (random() - 0.45) * 240;
    const close = open + move;
    const reach = Math.abs(move) * 0.55 + random() * 85;

    candles.push({
      open,
      close,
      high: Math.max(open, close) + random() * reach,
      low: Math.min(open, close) - random() * reach,
      volume: 18 + random() * 78,
    });
    price = close;
  }

  // Anchor the final close to the quoted price so the chart, the OHLC line
  // and the header ticker cannot disagree
  const shift = LAST_PRICE - candles[candles.length - 1].close;
  return candles.map((c) => ({
    ...c,
    open: c.open + shift,
    close: c.close + shift,
    high: c.high + shift,
    low: c.low + shift,
  }));
};

/* =============================================================== format ===*/

const money = (value, dp = 2) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });

/* ============================================================ CandleChart ===
   Hand-drawn SVG rather than a charting library.

   chartjs-chart-financial is not installed and would pull in a date adapter
   and date-fns with it - three packages - and the pieces that make this look
   like a terminal (the price pill riding the axis, the OHLC readout, the
   volume band sharing the price grid) would still be custom on top.

   Geometry lives in the SVG, but every LABEL is HTML positioned over it. The
   svg uses preserveAspectRatio="none" so it can stretch to any container
   width, and that would smear <text> horizontally; HTML labels stay crisp at
   every width and re-theme with the tokens. */
const CandleChart = ({ candles }) => {
  const W = 800;
  const H = 300;
  const VOL_H = 58;
  const GAP = 12;
  const priceH = H - VOL_H - GAP;

  const view = useMemo(() => {
    const highs = candles.map((c) => c.high);
    const lows = candles.map((c) => c.low);
    const max = Math.max(...highs);
    const min = Math.min(...lows);
    const pad = (max - min) * 0.08 || 1;
    const top = max + pad;
    const bottom = min - pad;
    const range = top - bottom;

    const y = (price) => ((top - price) / range) * priceH;
    const step = W / candles.length;
    const body = Math.max(2, step * 0.62);
    const maxVol = Math.max(...candles.map((c) => c.volume));

    // Round gridlines to something a trader would actually read
    const rough = range / 5;
    const magnitude = 10 ** Math.floor(Math.log10(rough));
    const niceStep = [1, 2, 2.5, 5, 10]
      .map((m) => m * magnitude)
      .find((s) => s >= rough);
    const first = Math.ceil(bottom / niceStep) * niceStep;

    const lines = [];
    for (let p = first; p < top; p += niceStep) {
      lines.push({ price: p, y: y(p), pct: (y(p) / priceH) * 100 });
    }

    return { top, bottom, y, step, body, maxVol, lines };
  }, [candles, priceH]);

  const last = candles[candles.length - 1];
  const lastPct = (view.y(last.close) / priceH) * 100;

  // Six evenly spaced clock labels across the window
  const timeLabels = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const hour = (6 + i * 4) % 24;
        return {
          text: `${String(hour).padStart(2, "0")}:00`,
          pct: (i / 5) * 100,
        };
      }),
    [],
  );

  return (
    <div className="bs-plot">
      <div className="bs-plot-canvas">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="bs-svg"
          aria-hidden="true"
          focusable="false"
        >
          {/* Grid */}
          {view.lines.map((line) => (
            <line
              key={line.price}
              className="bs-gridline"
              x1="0"
              x2={W}
              y1={line.y}
              y2={line.y}
            />
          ))}

          {/* Candles */}
          {candles.map((c, i) => {
            const cx = i * view.step + view.step / 2;
            const up = c.close >= c.open;
            const yOpen = view.y(c.open);
            const yClose = view.y(c.close);
            const bodyTop = Math.min(yOpen, yClose);
            // A doji would otherwise render as a zero-height invisible rect
            const bodyH = Math.max(1, Math.abs(yClose - yOpen));

            return (
              <g
                key={i}
                className={up ? "bs-candle is-up" : "bs-candle is-down"}
              >
                <rect
                  x={cx - 0.6}
                  y={view.y(c.high)}
                  width="1.2"
                  height={Math.max(1, view.y(c.low) - view.y(c.high))}
                />
                <rect
                  x={cx - view.body / 2}
                  y={bodyTop}
                  width={view.body}
                  height={bodyH}
                />
              </g>
            );
          })}

          {/* Volume band */}
          {candles.map((c, i) => {
            const cx = i * view.step + view.step / 2;
            const h = (c.volume / view.maxVol) * VOL_H;
            return (
              <rect
                key={`v${i}`}
                className={
                  c.close >= c.open ? "bs-vol is-up" : "bs-vol is-down"
                }
                x={cx - view.body / 2}
                y={H - h}
                width={view.body}
                height={h}
              />
            );
          })}

          <line
            className="bs-last-line"
            x1="0"
            x2={W}
            y1={view.y(last.close)}
            y2={view.y(last.close)}
          />
        </svg>

        {/* Time axis */}
        <div className="bs-time-axis">
          {timeLabels.map((t) => (
            <span key={t.text + t.pct} style={{ left: `${t.pct}%` }}>
              {t.text}
            </span>
          ))}
        </div>
      </div>

      {/* Price axis - HTML so the type never stretches with the svg */}
      <div className="bs-price-axis">
        {view.lines.map((line) => (
          <span key={line.price} style={{ top: `${line.pct}%` }}>
            {money(line.price, 0)}
          </span>
        ))}
        <b className="bs-last-pill" style={{ top: `${lastPct}%` }}>
          {money(last.close)}
        </b>
      </div>
    </div>
  );
};

/* ============================================================== component ===*/

const BuySell = () => {
  const [side, setSide] = useState("Buy");
  const [orderType, setOrderType] = useState("Limit");
  const [timeframe, setTimeframe] = useState("15m");
  const [orderTab, setOrderTab] = useState("Open Orders");
  const [watchlisted, setWatchlisted] = useState(false);
  const [advanced, setAdvanced] = useState(false);

  const [price, setPrice] = useState(LAST_PRICE.toFixed(2));
  const [amount, setAmount] = useState("0.0000");
  const [percent, setPercent] = useState(0);

  const candles = useMemo(
    () => buildCandles(TIMEFRAMES.indexOf(timeframe) * 977 + 13),
    [timeframe],
  );
  const last = candles[candles.length - 1];
  const first = candles[0];
  const sessionChange = last.close - first.open;
  const sessionPct = (sessionChange / first.open) * 100;

  const priceNum = parseFloat(price) || 0;
  const amountNum = parseFloat(amount) || 0;
  const total = priceNum * amountNum;
  const fee = total * FEE_RATE;

  /* The three fields describe one order, so they stay in sync: moving the
     percentage spends that share of the balance, which sets the amount. */
  const applyPercent = (pct) => {
    setPercent(pct);
    if (priceNum <= 0) return;
    const spend = (BALANCE * pct) / 100;
    setAmount((spend / priceNum).toFixed(6));
  };

  const nudge = (setter, current, delta, dp) => {
    const next = Math.max(0, (parseFloat(current) || 0) + delta);
    setter(next.toFixed(dp));
    setPercent(0);
  };

  const isBuy = side === "Buy";

  return (
    <section className="bs-page">
      {/* ============================ TOP BAR =========================== */}
      <div className="bs-topbar">
        <Link to="/livemarket" className="bs-back">
          <ArrowLeft size={15} /> Back to Market
        </Link>

        <div className="bs-topbar-actions">
          <button
            type="button"
            className={`bs-chip ${watchlisted ? "is-on" : ""}`}
            onClick={() => setWatchlisted((v) => !v)}
            aria-pressed={watchlisted}
          >
            <Star size={14} />
            {watchlisted ? "In Watchlist" : "Add to Watchlist"}
          </button>
          <button type="button" className="bs-chip">
            <Info size={14} /> Market Info
          </button>
        </div>
      </div>

      {/* ============================= HEADER =========================== */}
      <header className="bs-card bs-header">
        <div className="bs-symbol">
          <span className="bs-coin">₿</span>
          <div>
            <h1>
              {SYMBOL.base} / {SYMBOL.quote}
            </h1>
            <p>{SYMBOL.name}</p>
          </div>
        </div>

        <div className="bs-header-price">
          <strong>{money(LAST_PRICE)}</strong>
          <span className="bs-up">+2.45%</span>
        </div>

        <dl className="bs-header-stats">
          {HEAD_STATS.map((stat) => (
            <div key={stat.label}>
              <dt>{stat.label}</dt>
              <dd>{stat.value}</dd>
            </div>
          ))}
        </dl>
      </header>

      {/* ============================== GRID ============================ */}
      <div className="bs-grid">
        {/* ------------------------ ORDER TICKET ----------------------- */}
        <aside className="bs-card bs-ticket">
          <div className="bs-side-toggle" role="group" aria-label="Order side">
            <button
              type="button"
              className={`bs-side-btn is-buy ${isBuy ? "is-active" : ""}`}
              onClick={() => setSide("Buy")}
            >
              Buy
            </button>
            <button
              type="button"
              className={`bs-side-btn is-sell ${!isBuy ? "is-active" : ""}`}
              onClick={() => setSide("Sell")}
            >
              Sell
            </button>
          </div>

          <div className="bs-type-tabs" role="group" aria-label="Order type">
            {ORDER_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                className={orderType === type ? "is-active" : ""}
                onClick={() => setOrderType(type)}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="bs-balance">
            <span>Available Balance</span>
            <strong>
              {money(BALANCE)} {SYMBOL.quote}
              <button
                type="button"
                className="bs-add"
                aria-label="Deposit funds"
              >
                <Plus size={11} />
              </button>
            </strong>
          </div>

          <div className="bs-field">
            <label htmlFor="bs-price">Price ({SYMBOL.quote})</label>
            <div className="bs-input">
              <input
                id="bs-price"
                type="text"
                inputMode="decimal"
                value={orderType === "Market" ? "Market" : price}
                disabled={orderType === "Market"}
                onChange={(e) => setPrice(e.target.value)}
              />
              <button
                type="button"
                onClick={() => nudge(setPrice, price, -0.1, 2)}
                aria-label="Decrease price"
              >
                <Minus size={13} />
              </button>
              <button
                type="button"
                onClick={() => nudge(setPrice, price, 0.1, 2)}
                aria-label="Increase price"
              >
                <Plus size={13} />
              </button>
            </div>
            <small>≈ ${money(priceNum)}</small>
          </div>

          <div className="bs-field">
            <label htmlFor="bs-amount">Amount ({SYMBOL.base})</label>
            <div className="bs-input">
              <input
                id="bs-amount"
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setPercent(0);
                }}
              />
              <button
                type="button"
                onClick={() => nudge(setAmount, amount, -0.0001, 4)}
                aria-label="Decrease amount"
              >
                <Minus size={13} />
              </button>
              <button
                type="button"
                onClick={() => nudge(setAmount, amount, 0.0001, 4)}
                aria-label="Increase amount"
              >
                <Plus size={13} />
              </button>
            </div>
          </div>

          <div className="bs-slider">
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={percent}
              onChange={(e) => applyPercent(Number(e.target.value))}
              aria-label="Percentage of balance"
              style={{ "--fill": `${percent}%` }}
            />
            <div className="bs-slider-marks">
              {PERCENTS.map((p) => (
                <button key={p} type="button" onClick={() => applyPercent(p)}>
                  {p}%
                </button>
              ))}
            </div>
          </div>

          <div className="bs-field">
            <label htmlFor="bs-total">Total ({SYMBOL.quote})</label>
            <div className="bs-input">
              <input id="bs-total" type="text" readOnly value={money(total)} />
            </div>
            <small>≈ ${money(total)}</small>
          </div>

          <button
            type="button"
            className="bs-advanced"
            aria-expanded={advanced}
            onClick={() => setAdvanced((v) => !v)}
          >
            <span className={`bs-check ${advanced ? "is-on" : ""}`} />
            Advanced Options
            <ChevronDown size={13} className={advanced ? "is-flipped" : ""} />
          </button>

          {advanced && (
            <div className="bs-advanced-body">
              <label className="bs-toggle-row">
                <input type="checkbox" /> Post only
              </label>
              <label className="bs-toggle-row">
                <input type="checkbox" /> Reduce only
              </label>
              <label className="bs-toggle-row">
                <input type="checkbox" /> Time in force: GTC
              </label>
            </div>
          )}

          <button
            type="button"
            className={`bs-submit ${isBuy ? "is-buy" : "is-sell"}`}
          >
            {side} {SYMBOL.base}
          </button>

          <dl className="bs-estimates">
            <div>
              <dt>Est. Fee</dt>
              <dd>{(FEE_RATE * 100).toFixed(1)}%</dd>
            </div>
            <div>
              <dt>Est. Receive</dt>
              <dd>
                {isBuy
                  ? `${(amountNum - amountNum * FEE_RATE).toFixed(6)} ${SYMBOL.base}`
                  : `${money(total - fee)} ${SYMBOL.quote}`}
              </dd>
            </div>
          </dl>
        </aside>

        {/* --------------------------- CHART --------------------------- */}
        <div className="bs-col-center">
          <div className="bs-card">
            <div className="bs-chart-bar">
              <div className="bs-tf" role="group" aria-label="Timeframe">
                {TIMEFRAMES.map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    className={timeframe === tf ? "is-active" : ""}
                    onClick={() => setTimeframe(tf)}
                  >
                    {tf}
                  </button>
                ))}
              </div>

              <div className="bs-chart-tools">
                <button type="button" aria-label="Chart type">
                  <CandlestickChart size={15} />
                </button>
                <button type="button" aria-label="Compare">
                  <BarChart3 size={15} />
                </button>
                <button type="button" className="bs-tool-text">
                  Indicators
                </button>
                <button type="button" aria-label="Search symbol">
                  <Search size={15} />
                </button>
                <button type="button" aria-label="Chart settings">
                  <Settings size={15} />
                </button>
                <button type="button" aria-label="Snapshot">
                  <Camera size={15} />
                </button>
                <button type="button" aria-label="Fullscreen">
                  <Maximize2 size={15} />
                </button>
              </div>
            </div>

            <div className="bs-ohlc">
              <span className="bs-ohlc-title">
                {SYMBOL.base} / {SYMBOL.quote} · {timeframe}
              </span>
              <span className={sessionChange >= 0 ? "bs-up" : "bs-down"}>
                O{money(last.open)} H{money(last.high)} L{money(last.low)} C
                {money(last.close)} {sessionChange >= 0 ? "+" : ""}
                {money(sessionChange)} ({sessionPct >= 0 ? "+" : ""}
                {sessionPct.toFixed(2)}%)
              </span>
              <span className="bs-muted">Volume {last.volume.toFixed(2)}</span>
            </div>

            <CandleChart candles={candles} />
          </div>

          {/* ------------------------- ORDERS ------------------------- */}
          <div className="bs-card">
            <div className="bs-order-tabs" role="tablist">
              {ORDER_TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={orderTab === tab}
                  className={orderTab === tab ? "is-active" : ""}
                  onClick={() => setOrderTab(tab)}
                >
                  {tab}
                  {tab === "Open Orders" ? ` (${OPEN_ORDERS.length})` : ""}
                </button>
              ))}
            </div>

            <div className="bs-table-scroll">
              <table className="bs-table">
                <thead>
                  <tr>
                    <th>Pair</th>
                    <th>Type</th>
                    <th>Side</th>
                    <th>Price</th>
                    <th>Amount</th>
                    <th>Filled</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orderTab === "Open Orders" ? (
                    OPEN_ORDERS.map((order) => (
                      <tr key={order.pair}>
                        <td data-label="Pair" className="bs-pair">
                          {order.pair}
                        </td>
                        <td data-label="Type">{order.type}</td>
                        <td
                          data-label="Side"
                          className={order.side === "Buy" ? "bs-up" : "bs-down"}
                        >
                          {order.side}
                        </td>
                        <td data-label="Price">{order.price}</td>
                        <td data-label="Amount">{order.amount}</td>
                        <td data-label="Filled">{order.filled}</td>
                        <td data-label="Total">{order.total}</td>
                        <td data-label="Status">
                          <span
                            className={`bs-badge ${
                              order.status === "Open" ? "is-open" : "is-partial"
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td data-label="Action">
                          <button type="button" className="bs-cancel">
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9}>
                        <div className="bs-empty">
                          <TrendingUp size={18} />
                          <p>Nothing in {orderTab.toLowerCase()} yet.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ------------------------- RIGHT RAIL ------------------------ */}
        <aside className="bs-col-right">
          <div className="bs-card">
            <div className="bs-card-head">
              <h2>Order Book</h2>
              <select className="bs-select" aria-label="Price precision">
                <option>0.01</option>
                <option>0.1</option>
                <option>1</option>
              </select>
            </div>

            <div className="bs-book-head">
              <span>Price ({SYMBOL.quote})</span>
              <span>Amount ({SYMBOL.base})</span>
              <span>Total ({SYMBOL.quote})</span>
            </div>

            <div className="bs-book-side is-asks">
              {ASKS.map((row) => (
                <button
                  type="button"
                  className="bs-book-row"
                  key={row.price}
                  onClick={() => setPrice(row.price.toFixed(2))}
                >
                  <i style={{ width: `${row.depth}%` }} />
                  <span className="bs-down">{money(row.price)}</span>
                  <span>{row.amount.toFixed(4)}</span>
                  <span className="bs-muted">{row.total}</span>
                </button>
              ))}
            </div>

            <div className="bs-book-mid">
              <strong className="bs-up">{money(LAST_PRICE)}</strong>
              <span className="bs-up">▲ +2.45%</span>
              <small>≈ ${money(LAST_PRICE)}</small>
            </div>

            <div className="bs-book-side is-bids">
              {BIDS.map((row) => (
                <button
                  type="button"
                  className="bs-book-row"
                  key={row.price}
                  onClick={() => setPrice(row.price.toFixed(2))}
                >
                  <i style={{ width: `${row.depth}%` }} />
                  <span className="bs-up">{money(row.price)}</span>
                  <span>{row.amount.toFixed(4)}</span>
                  <span className="bs-muted">{row.total}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bs-card">
            <div className="bs-card-head">
              <h2>Recent Trades</h2>
            </div>

            <div className="bs-book-head">
              <span>Price ({SYMBOL.quote})</span>
              <span>Amount ({SYMBOL.base})</span>
              <span>Time</span>
            </div>

            <div className="bs-trade-list">
              {RECENT_TRADES.map((trade) => (
                <div className="bs-trade-row" key={trade.time}>
                  <span className={trade.up ? "bs-up" : "bs-down"}>
                    {money(trade.price)}
                  </span>
                  <span>{trade.amount.toFixed(4)}</span>
                  <span className="bs-muted">{trade.time}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* =========================== ASSURANCES ========================= */}
      <div className="bs-card bs-assurances">
        {ASSURANCES.map(({ icon: Icon, title, copy }) => (
          <div className="bs-assurance" key={title}>
            <span className="bs-assurance-icon">
              <Icon size={17} />
            </span>
            <div>
              <b>{title}</b>
              <small>{copy}</small>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default BuySell;
