import { useMemo, useState } from "react";
import "./Terminal.css";

/* Deterministic PRNG. Every series on this page is seeded, so the terminal
   looks identical on every render and between deploys — a marketing
   screenshot that reshuffles itself looks broken. */
const rng = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/* ---------- geometry ----------
   The SVG keeps its aspect ratio and scales with the column, so candles are
   never stretched. The previous version used preserveAspectRatio="none",
   which squashed a 560-wide drawing into an 828px box — a 1.48x horizontal
   stretch that made every wick and body look fat and flat. */
const VB_W = 760;
const VB_H = 340;
const PLOT_L = 10;
const PLOT_R = 690; // 690-760 is the price axis gutter
const PRICE_T = 18;
const PRICE_B = 246;
const VOL_T = 268;
const VOL_B = 316;

const CANDLES = 40;

/* Each timeframe draws its own series, so the tabs actually do something */
const TIMEFRAMES = [
  { id: "5m", seed: 411, step: 5 },
  { id: "15m", seed: 2024, step: 15 },
  { id: "1H", seed: 733, step: 60 },
  { id: "4H", seed: 1290, step: 240 },
  { id: "1D", seed: 88, step: 1440 },
];

const buildSeries = (seed) => {
  const next = rng(seed);
  const out = [];
  let price = 63400;

  for (let i = 0; i < CANDLES; i++) {
    const open = price;
    const close = open + (next() - 0.44) * 430;
    const wick = 55 + next() * 230;
    out.push({
      open,
      close,
      high: Math.max(open, close) + wick,
      low: Math.min(open, close) - wick,
      // Volume tracks the size of the move, the way it does on a real tape
      volume: 0.35 + Math.abs(close - open) / 430 + next() * 0.45,
    });
    price = close;
  }
  return out;
};

/* Labels are generated backwards from a fixed point so they never depend on
   the current clock — the page must not render differently at 3am. */
const timeLabel = (stepMin, slotsBack) => {
  const base = new Date(Date.UTC(2024, 6, 15, 16, 0));
  const d = new Date(base.getTime() - slotsBack * stepMin * 60000);
  if (stepMin >= 1440) {
    return `${d.getUTCDate()} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getUTCMonth()]}`;
  }
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
};

const WATCHLIST = [
  { sym: "BTC/USD", price: "64,384", change: 2.41 },
  { sym: "ETH/USD", price: "3,142", change: -0.82 },
  { sym: "SOL/USD", price: "148.62", change: 5.13 },
  { sym: "AAPL", price: "221.05", change: 1.12 },
  { sym: "EUR/USD", price: "1.0842", change: -0.21 },
];

const BOOK_ASKS = [
  { price: 64251.8, size: 0.482 },
  { price: 64243.1, size: 1.204 },
  { price: 64236.5, size: 0.317 },
  { price: 64229.9, size: 2.061 },
];

const BOOK_BIDS = [
  { price: 64218.4, size: 0.938 },
  { price: 64211.2, size: 1.476 },
  { price: 64204.7, size: 0.652 },
  { price: 64196.3, size: 2.884 },
];

const money = (n, d = 2) =>
  n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

const Terminal = () => {
  const [side, setSide] = useState("buy");
  const [tfId, setTfId] = useState("15m");

  const tf = TIMEFRAMES.find((t) => t.id === tfId);

  const chart = useMemo(() => {
    const candles = buildSeries(tf.seed);

    const highs = candles.map((c) => c.high);
    const lows = candles.map((c) => c.low);
    const hi = Math.max(...highs);
    const lo = Math.min(...lows);
    const pad = (hi - lo) * 0.06;
    const top = hi + pad;
    const bottom = lo - pad;

    const y = (v) => PRICE_B - ((v - bottom) / (top - bottom)) * (PRICE_B - PRICE_T);
    const slot = (PLOT_R - PLOT_L) / CANDLES;
    const x = (i) => PLOT_L + i * slot + slot / 2;

    const maxVol = Math.max(...candles.map((c) => c.volume));
    const volY = (v) => VOL_B - (v / maxVol) * (VOL_B - VOL_T);

    // Five evenly spaced price gridlines, labelled on the right gutter
    const ticks = Array.from({ length: 5 }, (_, i) => {
      const v = bottom + ((top - bottom) * i) / 4;
      return { v, y: y(v) };
    });

    // Area fill traced along the closes, dropped to the baseline and closed
    const closes = candles.map((c, i) => `${x(i)},${y(c.close)}`);
    const area = `M${PLOT_L},${PRICE_B} L${closes.join(" L")} L${PLOT_R},${PRICE_B} Z`;
    const line = `M${closes.join(" L")}`;

    const last = candles[candles.length - 1];
    const first = candles[0];
    const pct = ((last.close - first.open) / first.open) * 100;

    return { candles, y, x, slot, volY, ticks, area, line, last, pct };
  }, [tf]);

  const { candles, y, x, slot, volY, ticks, area, line, last, pct } = chart;
  const bodyW = Math.max(slot * 0.56, 2);
  const up = pct >= 0;

  const maxSize = Math.max(
    ...BOOK_ASKS.map((r) => r.size),
    ...BOOK_BIDS.map((r) => r.size),
  );

  return (
    <section className="nx-sec terminal-sec">
      <div className="nx-sec-glow nx-sec-glow--tl" />
      <div className="container">
        <div className="nx-head nx-reveal">
          <span className="nx-eyebrow">
            <span className="nx-eyebrow-dot" />
            The terminal
          </span>
          <h2 className="nx-title">
            Watchlist, chart, book and ticket —{" "}
            <span className="nx-grad">one screen.</span>
          </h2>
          <p className="nx-sub">
            No pop-outs, no context switching. Read the tape, size the trade and
            send it without ever leaving the chart.
          </p>
        </div>

        <div className="tm-shell" data-tilt-in>
          {/* ================= TOP BAR ================= */}
          <header className="tm-bar">
            <span className="tm-dots" aria-hidden="true">
              <i /> <i /> <i />
            </span>

            <span className="tm-pair">
              <span className="tm-pair-badge">₿</span>
              BTC/USD
            </span>

            <div className="tm-tfs" role="group" aria-label="Chart timeframe">
              {TIMEFRAMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`tm-tf ${t.id === tfId ? "is-active" : ""}`}
                  onClick={() => setTfId(t.id)}
                  aria-pressed={t.id === tfId}
                >
                  {t.id}
                </button>
              ))}
            </div>

            <span className="tm-live">
              <span className="tm-live-dot" />
              Live
            </span>
          </header>

          <div className="tm-body">
            {/* ================= WATCHLIST ================= */}
            <aside className="tm-watch">
              <p className="tm-panel-title">Watchlist</p>
              {WATCHLIST.map((w, i) => (
                <div className={`tm-watch-row ${i === 0 ? "is-active" : ""}`} key={w.sym}>
                  <span className="tm-watch-sym">{w.sym}</span>
                  <span className="tm-watch-meta">
                    <span className="tm-watch-price">{w.price}</span>
                    <span className={w.change >= 0 ? "tm-pos" : "tm-neg"}>
                      {w.change >= 0 ? "+" : ""}
                      {w.change.toFixed(2)}%
                    </span>
                  </span>
                </div>
              ))}
            </aside>

            {/* ================= CHART ================= */}
            <div className="tm-chart">
              <div className="tm-quote">
                <span className="tm-last">{money(last.close)}</span>
                <span className={`tm-delta ${up ? "tm-pos" : "tm-neg"}`}>
                  {up ? "▲" : "▼"} {Math.abs(pct).toFixed(2)}%
                </span>
                <span className="tm-ohlc">
                  <b>O</b> {money(last.open)} <b>H</b> {money(last.high)}{" "}
                  <b>L</b> {money(last.low)} <b>C</b> {money(last.close)}
                </span>
              </div>

              <svg
                className="tm-svg"
                viewBox={`0 0 ${VB_W} ${VB_H}`}
                role="img"
                aria-label={`Illustrative BTC/USD ${tfId} candlestick chart with volume`}
              >
                <defs>
                  <linearGradient id="tmArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* gridlines + price axis */}
                {ticks.map((t) => (
                  <g key={t.v}>
                    <line
                      x1={PLOT_L}
                      x2={PLOT_R}
                      y1={t.y}
                      y2={t.y}
                      stroke="rgba(255,255,255,0.055)"
                      strokeWidth="1"
                    />
                    <text className="tm-axis" x={PLOT_R + 12} y={t.y + 3.5}>
                      {money(t.v, 0)}
                    </text>
                  </g>
                ))}

                {/* trend area under the closes */}
                <path d={area} fill="url(#tmArea)" />
                <path
                  d={line}
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="1.2"
                  strokeOpacity="0.5"
                  strokeLinejoin="round"
                />

                {/* candles */}
                {candles.map((c, i) => {
                  const rising = c.close >= c.open;
                  const stroke = rising ? "var(--primary)" : "var(--accent-red)";
                  const cx = x(i);
                  const bTop = y(Math.max(c.open, c.close));
                  const bBot = y(Math.min(c.open, c.close));
                  return (
                    <g key={i}>
                      <line
                        x1={cx}
                        x2={cx}
                        y1={y(c.high)}
                        y2={y(c.low)}
                        stroke={stroke}
                        strokeWidth="1.1"
                        opacity="0.8"
                      />
                      <rect
                        x={cx - bodyW / 2}
                        y={bTop}
                        width={bodyW}
                        /* a doji would otherwise be a zero-height, invisible rect */
                        height={Math.max(bBot - bTop, 1.6)}
                        fill={stroke}
                        opacity={rising ? 0.95 : 0.85}
                        rx="1"
                      />
                    </g>
                  );
                })}

                {/* volume histogram */}
                <line
                  x1={PLOT_L}
                  x2={PLOT_R}
                  y1={VOL_B}
                  y2={VOL_B}
                  stroke="rgba(255,255,255,0.07)"
                  strokeWidth="1"
                />
                {candles.map((c, i) => {
                  const rising = c.close >= c.open;
                  const vy = volY(c.volume);
                  return (
                    <rect
                      key={i}
                      x={x(i) - bodyW / 2}
                      y={vy}
                      width={bodyW}
                      height={VOL_B - vy}
                      fill={rising ? "var(--primary)" : "var(--accent-red)"}
                      opacity="0.32"
                      rx="1"
                    />
                  );
                })}

                {/* last price marker */}
                <line
                  x1={PLOT_L}
                  x2={PLOT_R}
                  y1={y(last.close)}
                  y2={y(last.close)}
                  stroke="var(--primary)"
                  strokeWidth="1"
                  strokeDasharray="5 5"
                  opacity="0.6"
                />
                <rect
                  x={PLOT_R + 4}
                  y={y(last.close) - 10}
                  width={66}
                  height={20}
                  rx="4"
                  fill="var(--primary)"
                />
                <text className="tm-axis-last" x={PLOT_R + 37} y={y(last.close) + 4}>
                  {money(last.close, 0)}
                </text>

                {/* time axis */}
                {[0, 10, 20, 30, 39].map((i) => (
                  <text className="tm-axis" key={i} x={x(i)} y={VB_H - 6} textAnchor="middle">
                    {timeLabel(tf.step, CANDLES - 1 - i)}
                  </text>
                ))}
              </svg>
            </div>

            {/* ================= BOOK + TICKET ================= */}
            <aside className="tm-side">
              <div className="tm-book">
                <p className="tm-panel-title">Order book</p>

                {BOOK_ASKS.map((r) => (
                  <div className="tm-book-row is-ask" key={r.price}>
                    <i style={{ width: `${(r.size / maxSize) * 100}%` }} />
                    <span className="tm-book-price">{r.price.toFixed(1)}</span>
                    <span className="tm-book-size">{r.size.toFixed(3)}</span>
                  </div>
                ))}

                <div className="tm-spread">
                  <span>{money(last.close, 1)}</span>
                  <span className="tm-spread-label">spread 11.5</span>
                </div>

                {BOOK_BIDS.map((r) => (
                  <div className="tm-book-row is-bid" key={r.price}>
                    <i style={{ width: `${(r.size / maxSize) * 100}%` }} />
                    <span className="tm-book-price">{r.price.toFixed(1)}</span>
                    <span className="tm-book-size">{r.size.toFixed(3)}</span>
                  </div>
                ))}
              </div>

              <div className="tm-ticket">
                <div className="tm-sides">
                  <button
                    type="button"
                    className={`tm-side-btn is-buy ${side === "buy" ? "is-active" : ""}`}
                    onClick={() => setSide("buy")}
                  >
                    Buy
                  </button>
                  <button
                    type="button"
                    className={`tm-side-btn is-sell ${side === "sell" ? "is-active" : ""}`}
                    onClick={() => setSide("sell")}
                  >
                    Sell
                  </button>
                </div>

                <label className="tm-field">
                  <span>Amount</span>
                  <span className="tm-input">
                    0.2500 <em>BTC</em>
                  </span>
                </label>

                <label className="tm-field">
                  <span>Order type</span>
                  <span className="tm-input">Limit</span>
                </label>

                <div className="tm-total">
                  <span>Est. total</span>
                  <strong>${money(last.close * 0.25)}</strong>
                </div>

                <a
                  href="/register"
                  className={`tm-submit ${side === "buy" ? "is-buy" : "is-sell"}`}
                >
                  {side === "buy" ? "Buy BTC" : "Sell BTC"}
                </a>
              </div>
            </aside>
          </div>

          {/* ================= STATUS STRIP ================= */}
          <footer className="tm-status">
            <span className="tm-stat">
              <b>Position</b> 0.75 BTC
            </span>
            <span className="tm-stat">
              <b>Avg entry</b> 62,940.00
            </span>
            <span className="tm-stat">
              <b>Unrealised</b> <em className="tm-pos">+1,083.37</em>
            </span>
            <span className="tm-stat">
              <b>Margin used</b> 18.4%
            </span>
            <span className="tm-stat tm-stat--end">
              <b>Latency</b> 38ms
            </span>
          </footer>
        </div>

        <p className="tm-note nx-reveal">
          Interface preview with illustrative data — not a live feed.
        </p>
      </div>
    </section>
  );
};

export default Terminal;
