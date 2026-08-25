import { useEffect, useRef, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import {
  Star,
  ChevronDown,
  Plus,
  Minus,
  Maximize2,
  TrendingUp,
  TrendingDown,
  Activity,
} from "lucide-react";
import "./LiveMarket.css";
import useChartTheme from "../../utils/chartTheme";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
);

/* --------------------------------------------------------------- data ---
   Static fixtures live at module scope: rebuilding them every render would
   only hand React new array identities for no benefit. */

const TICKER_STATS = [
  { label: "24h High", value: "67,890.25" },
  { label: "24h Low", value: "65,432.10" },
  { label: "24h Volume", value: "24,562.34 BTC" },
  { label: "24h Turnover", value: "$1.65B" },
];

const MARKETS = [
  { pair: "BTC / USDT", mark: "B", key: "btc", price: "67,245.80", change: "+2.45%", up: true },
  { pair: "ETH / USDT", mark: "E", key: "eth", price: "3,512.75", change: "+1.65%", up: true },
  { pair: "BNB / USDT", mark: "B", key: "bnb", price: "602.45", change: "+0.85%", up: true },
  { pair: "SOL / USDT", mark: "S", key: "sol", price: "142.35", change: "+1.25%", up: true },
  { pair: "XRP / USDT", mark: "X", key: "xrp", price: "0.5987", change: "-0.35%", up: false },
];

const RECENT_TRADES = [
  { price: "67,245.80", amount: "0.0456", time: "18:45:32", up: true },
  { price: "67,245.10", amount: "0.1250", time: "18:45:31", up: false },
  { price: "67,244.70", amount: "0.0852", time: "18:45:30", up: false },
  { price: "67,244.30", amount: "0.1556", time: "18:45:29", up: true },
  { price: "67,243.95", amount: "0.0327", time: "18:45:28", up: true },
  { price: "67,243.20", amount: "0.2104", time: "18:45:27", up: false },
];

const MARKET_INFO = [
  { label: "Rank", value: "#1" },
  { label: "Market Cap", value: "$1.32T" },
  { label: "Circulating Supply", value: "19.69M BTC" },
  { label: "FDV", value: "$1.41T" },
  { label: "All Time High", value: "$73,750.07" },
  { label: "All Time Low", value: "$67.81" },
];

/* `depth` drives each row's background bar, so the book reads as a shape at a
   glance instead of as twelve lines of digits. */
const ASKS = [
  { price: "67,249.50", amount: "0.1250", total: "8,405.56", depth: 34 },
  { price: "67,249.10", amount: "0.0852", total: "5,723.65", depth: 23 },
  { price: "67,248.70", amount: "0.1556", total: "10,462.81", depth: 45 },
  { price: "67,248.20", amount: "0.2410", total: "16,206.81", depth: 68 },
  { price: "67,247.80", amount: "0.0925", total: "6,220.42", depth: 26 },
  { price: "67,247.30", amount: "0.3180", total: "21,384.64", depth: 88 },
];

const BIDS = [
  { price: "67,245.50", amount: "0.1523", total: "10,241.21", depth: 42 },
  { price: "67,245.10", amount: "0.0856", total: "5,749.59", depth: 24 },
  { price: "67,244.70", amount: "0.1256", total: "8,449.97", depth: 35 },
  { price: "67,244.20", amount: "0.2874", total: "19,326.98", depth: 79 },
  { price: "67,243.80", amount: "0.1042", total: "7,006.80", depth: 29 },
  { price: "67,243.10", amount: "0.1965", total: "13,213.27", depth: 55 },
];

const OPEN_ORDERS = [
  { pair: "BTC / USDT", mark: "B", key: "btc", type: "Limit", side: "Buy", price: "67,200.00", amount: "0.1250", filled: "0.0000", total: "8,400.00" },
  { pair: "ETH / USDT", mark: "E", key: "eth", type: "Limit", side: "Sell", price: "3,550.00", amount: "1.2500", filled: "0.0000", total: "4,437.50" },
  { pair: "SOL / USDT", mark: "S", key: "sol", type: "Stop Limit", side: "Buy", price: "138.40", amount: "12.0000", filled: "3.5000", total: "1,660.80" },
];

const TIMEFRAMES = ["1m", "5m", "15m", "1H", "4H", "1D"];
const RANGES = ["1D", "5D", "1M", "3M", "6M", "1Y", "All"];
const ORDER_TYPES = ["Limit", "Market", "Stop Limit"];
const CHART_TABS = ["Chart", "Market Depth", "Trade History"];
const PERCENTS = ["0%", "25%", "50%", "75%", "100%"];

const CHART_LABELS = ["06:00", "09:00", "12:00", "15:00", "18:00", "21:00"];
const CHART_PRICES = [65400, 66200, 67800, 67100, 68000, 67245.8];

/* ------------------------------------------------------------ helpers ---*/

/* Pointer-driven tilt for the hero card. The angles are written to CSS custom
   properties rather than to `transform` directly, so the stylesheet keeps
   ownership of the whole transform (hover lift, reduced-motion opt-out) and
   this hook only ever contributes two numbers.
   Bails out entirely on coarse pointers and for reduced-motion users. */
const useCardTilt = (maxTilt = 5) => {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || still.matches) return;

    let frame = 0;

    const onMove = (event) => {
      if (frame) return; // coalesce to one update per frame, not per event
      frame = requestAnimationFrame(() => {
        frame = 0;
        const box = el.getBoundingClientRect();
        const px = (event.clientX - box.left) / box.width - 0.5;
        const py = (event.clientY - box.top) / box.height - 0.5;
        el.style.setProperty("--tilt-x", `${(-py * maxTilt).toFixed(2)}deg`);
        el.style.setProperty("--tilt-y", `${(px * maxTilt).toFixed(2)}deg`);
      });
    };

    const reset = () => {
      el.style.setProperty("--tilt-x", "0deg");
      el.style.setProperty("--tilt-y", "0deg");
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", reset);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", reset);
    };
  }, [maxTilt]);

  return ref;
};

const Delta = ({ value, up }) => (
  <span className={`lm-delta ${up ? "is-up" : "is-down"}`}>
    {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
    {value}
  </span>
);

/* ---------------------------------------------------------- component ---*/

const LiveMarket = () => {
  const [orderSide, setOrderSide] = useState("Buy");
  const [orderType, setOrderType] = useState("Limit");
  const [timeframe, setTimeframe] = useState("5m");
  const [range, setRange] = useState("1D");
  const [chartTab, setChartTab] = useState("Chart");
  const [watchlisted, setWatchlisted] = useState(false);

  const heroRef = useCardTilt();
  const chart = useChartTheme();

  const chartData = {
    labels: CHART_LABELS,
    datasets: [
      {
        label: "BTC Price",
        data: CHART_PRICES,
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
          gradient.addColorStop(0, "rgba(0, 255, 178, 0.28)");
          gradient.addColorStop(0.65, "rgba(0, 255, 178, 0.05)");
          gradient.addColorStop(1, "rgba(0, 255, 178, 0)");
          return gradient;
        },
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: chart.tooltipBg,
        borderColor: chart.tooltipBorder,
        borderWidth: 1,
        titleColor: chart.tooltipTitle,
        bodyColor: chart.tooltipBody,
        padding: 10,
        displayColors: false,
        callbacks: {
          label: (item) => `$${item.parsed.y.toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        border: { display: false },
        grid: { color: "rgba(255, 255, 255, 0.04)" },
        ticks: { color: chart.tick, font: { size: 11 }, maxRotation: 0 },
      },
      y: {
        position: "right",
        border: { display: false },
        grid: { color: "rgba(255, 255, 255, 0.04)" },
        ticks: {
          color: chart.tick,
          font: { size: 11 },
          callback: (value) => `${(value / 1000).toFixed(1)}k`,
        },
      },
    },
  };

  return (
    <section className="lm-page">
      {/* ============================ HEADER =========================== */}
      <header className="lm-header">
        <div>
          <p className="lm-eyebrow">
            <Activity size={13} /> Market Terminal
          </p>
          <h1 className="lm-title">Live Market</h1>
          <p className="lm-subtitle">
            Track prices, liquidity and execute trades in real time.
          </p>
        </div>

        <div className="lm-header-actions">
          <span className="lm-status">
            <i className="lm-status-dot" /> Market open
          </span>
          <button
            type="button"
            className={`lm-btn-watch ${watchlisted ? "is-on" : ""}`}
            onClick={() => setWatchlisted((prev) => !prev)}
            aria-pressed={watchlisted}
          >
            <Star size={14} />
            {watchlisted ? "In Watchlist" : "Add to Watchlist"}
          </button>
        </div>
      </header>

      {/* ============================= HERO ============================ */}
      <div className="lm-card lm-hero" ref={heroRef}>
        <div className="lm-hero-pair">
          <span className="lm-coin lm-coin--btc">B</span>
          <div>
            <button type="button" className="lm-pair-select">
              BTC / USDT <ChevronDown size={15} />
            </button>
            <p className="lm-pair-name">Bitcoin</p>
          </div>
        </div>

        <div className="lm-hero-price">
          <span className="lm-f-price">$67,245.80</span>
          <Delta value="+1,605.32 (+2.45%)" up />
        </div>

        <dl className="lm-hero-stats">
          {TICKER_STATS.map((stat) => (
            <div className="lm-stat" key={stat.label}>
              <dt>{stat.label}</dt>
              <dd>{stat.value}</dd>
            </div>
          ))}
          <div className="lm-stat">
            <dt>24h Change</dt>
            <dd className="lm-up">+2.45%</dd>
          </div>
        </dl>
      </div>

      {/* ============================= GRID ============================ */}
      <div className="lm-grid">
        {/* ------------------------ LEFT COLUMN ----------------------- */}
        <div className="lm-col-main">
          {/* CHART */}
          <div className="lm-card lm-chart-card">
            <div className="lm-card-head">
              <div className="lm-tabs" role="tablist" aria-label="Chart view">
                {CHART_TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={chartTab === tab}
                    className={`lm-tab ${chartTab === tab ? "is-active" : ""}`}
                    onClick={() => setChartTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="lm-chart-controls">
                <div className="lm-segment" role="group" aria-label="Timeframe">
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
                <button
                  type="button"
                  className="lm-icon-btn"
                  aria-label="Expand chart"
                >
                  <Maximize2 size={15} />
                </button>
              </div>
            </div>

            <div className="lm-chart-body">
              <Line data={chartData} options={chartOptions} />
            </div>

            <div className="lm-card-foot">
              <div className="lm-range" role="group" aria-label="Date range">
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
              <span className="lm-clock">18:45:32 (UTC+5:30)</span>
            </div>
          </div>

          {/* THREE PANELS */}
          <div className="lm-panels">
            <div className="lm-card lm-panel">
              <h2 className="lm-panel-title">Market Overview</h2>
              <ul className="lm-market-list">
                {MARKETS.map((m) => (
                  <li key={m.pair}>
                    <span className="lm-market-id">
                      <i className={`lm-coin lm-coin--sm lm-coin--${m.key}`}>
                        {m.mark}
                      </i>
                      {m.pair}
                    </span>
                    <span className="lm-market-val">
                      <b>{m.price}</b>
                      <Delta value={m.change} up={m.up} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lm-card lm-panel">
              <h2 className="lm-panel-title">Recent Trades</h2>
              <div className="lm-mini-table">
                <div className="lm-mini-head">
                  <span>Price (USDT)</span>
                  <span>Amount</span>
                  <span>Time</span>
                </div>
                <div className="lm-mini-body">
                  {RECENT_TRADES.map((t) => (
                    <div className="lm-mini-row" key={t.time}>
                      <span className={t.up ? "lm-up" : "lm-down"}>
                        {t.price}
                      </span>
                      <span>{t.amount}</span>
                      <span className="lm-muted">{t.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lm-card lm-panel">
              <h2 className="lm-panel-title">Market Info</h2>
              <dl className="lm-info-list">
                {MARKET_INFO.map((row) => (
                  <div key={row.label}>
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* OPEN ORDERS */}
          <div className="lm-card lm-orders">
            <div className="lm-card-head">
              <div className="lm-tabs">
                <button type="button" className="lm-tab is-active">
                  Open Orders ({OPEN_ORDERS.length})
                </button>
                <button type="button" className="lm-tab">
                  Order History
                </button>
              </div>
            </div>

            <div className="lm-table-scroll">
              <table className="lm-table">
                <thead>
                  <tr>
                    <th>Pair</th>
                    <th>Type</th>
                    <th>Side</th>
                    <th>Price (USDT)</th>
                    <th>Amount</th>
                    <th>Filled</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th aria-label="Action" />
                  </tr>
                </thead>
                <tbody>
                  {OPEN_ORDERS.map((o) => (
                    <tr key={`${o.pair}-${o.price}`}>
                      <td data-label="Pair" className="is-pair">
                        <span className="lm-market-id">
                          <i className={`lm-coin lm-coin--sm lm-coin--${o.key}`}>
                            {o.mark}
                          </i>
                          {o.pair}
                        </span>
                      </td>
                      <td data-label="Type">{o.type}</td>
                      <td
                        data-label="Side"
                        className={o.side === "Buy" ? "lm-up" : "lm-down"}
                      >
                        {o.side}
                      </td>
                      <td data-label="Price">{o.price}</td>
                      <td data-label="Amount">{o.amount}</td>
                      <td data-label="Filled">{o.filled}</td>
                      <td data-label="Total">{o.total}</td>
                      <td data-label="Status">
                        <span className="lm-badge">Open</span>
                      </td>
                      <td data-label="Action">
                        <button type="button" className="lm-btn-cancel">
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ------------------------ RIGHT RAIL ------------------------ */}
        <aside className="lm-col-side">
          {/* ORDER BOOK */}
          <div className="lm-card lm-book">
            <div className="lm-card-head">
              <h2 className="lm-panel-title">Order Book</h2>
              <select className="lm-select" aria-label="Price precision">
                <option>0.01</option>
                <option>0.1</option>
                <option>1</option>
              </select>
            </div>

            <div className="lm-book-head">
              <span>Price (USDT)</span>
              <span>Amount (BTC)</span>
              <span>Total</span>
            </div>

            <div className="lm-book-side lm-book-side--asks">
              {ASKS.map((row) => (
                <div className="lm-book-row" key={row.price}>
                  <i
                    className="lm-book-depth"
                    style={{ width: `${row.depth}%` }}
                  />
                  <span className="lm-down">{row.price}</span>
                  <span>{row.amount}</span>
                  <span className="lm-muted">{row.total}</span>
                </div>
              ))}
            </div>

            <div className="lm-book-mid">
              <span className="lm-book-mid-price lm-up">67,245.80</span>
              <Delta value="2.45%" up />
            </div>

            <div className="lm-book-side lm-book-side--bids">
              {BIDS.map((row) => (
                <div className="lm-book-row" key={row.price}>
                  <i
                    className="lm-book-depth"
                    style={{ width: `${row.depth}%` }}
                  />
                  <span className="lm-up">{row.price}</span>
                  <span>{row.amount}</span>
                  <span className="lm-muted">{row.total}</span>
                </div>
              ))}
            </div>

            <div className="lm-ratio">
              <div className="lm-ratio-bar">
                <span className="lm-ratio-buy" style={{ width: "58%" }} />
                <span className="lm-ratio-sell" style={{ width: "42%" }} />
              </div>
              <div className="lm-ratio-legend">
                <span className="lm-up">B 58%</span>
                <span className="lm-down">42% S</span>
              </div>
            </div>
          </div>

          {/* TRADE FORM */}
          <div className="lm-card lm-trade">
            <div className="lm-side-toggle" role="group" aria-label="Order side">
              <button
                type="button"
                className={`lm-side-btn is-buy ${orderSide === "Buy" ? "is-active" : ""}`}
                onClick={() => setOrderSide("Buy")}
              >
                Buy
              </button>
              <button
                type="button"
                className={`lm-side-btn is-sell ${orderSide === "Sell" ? "is-active" : ""}`}
                onClick={() => setOrderSide("Sell")}
              >
                Sell
              </button>
            </div>

            <div
              className="lm-segment lm-segment--full"
              role="group"
              aria-label="Order type"
            >
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

            <div className="lm-form">
              <div className="lm-field">
                <label htmlFor="lm-f-price">Price (USDT)</label>
                <div className="lm-input">
                  <input
                    id="lm-f-price"
                    type="text"
                    defaultValue="67245.80"
                    inputMode="decimal"
                  />
                  <button type="button" aria-label="Decrease price">
                    <Minus size={13} />
                  </button>
                  <button type="button" aria-label="Increase price">
                    <Plus size={13} />
                  </button>
                </div>
              </div>

              <div className="lm-field">
                <label htmlFor="lm-f-amount">Amount (BTC)</label>
                <div className="lm-input">
                  <input
                    id="lm-f-amount"
                    type="text"
                    placeholder="0.00"
                    inputMode="decimal"
                  />
                  <button type="button" aria-label="Decrease amount">
                    <Minus size={13} />
                  </button>
                  <button type="button" aria-label="Increase amount">
                    <Plus size={13} />
                  </button>
                </div>
              </div>

              <div className="lm-percent">
                {PERCENTS.map((pct) => (
                  <button key={pct} type="button">
                    {pct}
                  </button>
                ))}
              </div>

              <div className="lm-field">
                <label htmlFor="lm-f-total">Total (USDT)</label>
                <div className="lm-input">
                  <input
                    id="lm-f-total"
                    type="text"
                    placeholder="0.00"
                    inputMode="decimal"
                  />
                </div>
              </div>

              <div className="lm-balance">
                <span>Available Balance</span>
                <strong>24,562.34 USDT</strong>
              </div>

              <button
                type="button"
                className={`lm-submit ${orderSide === "Buy" ? "is-buy" : "is-sell"}`}
              >
                {orderSide} BTC
              </button>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default LiveMarket;
