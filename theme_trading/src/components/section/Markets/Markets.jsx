import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import "./Markets.css";

/* Illustrative pricing for the marketing page — not a live feed.
   `change` drives both the colour and the sparkline direction, so the two can
   never disagree. */
const MARKETS = {
  crypto: [
    { sym: "BTC", name: "Bitcoin", price: 64218.4, change: 2.41, seed: 11 },
    { sym: "ETH", name: "Ethereum", price: 3142.18, change: -0.82, seed: 27 },
    { sym: "SOL", name: "Solana", price: 148.62, change: 5.13, seed: 43 },
    { sym: "XRP", name: "Ripple", price: 0.5284, change: -1.24, seed: 58 },
    { sym: "ADA", name: "Cardano", price: 0.4471, change: 1.86, seed: 72 },
  ],
  stocks: [
    { sym: "AAPL", name: "Apple Inc.", price: 221.05, change: 1.12, seed: 91 },
    { sym: "NVDA", name: "NVIDIA Corp.", price: 118.34, change: 3.47, seed: 15 },
    { sym: "TSLA", name: "Tesla Inc.", price: 246.9, change: -2.05, seed: 34 },
    { sym: "MSFT", name: "Microsoft", price: 428.16, change: 0.64, seed: 52 },
    { sym: "AMZN", name: "Amazon", price: 186.42, change: -0.38, seed: 66 },
  ],
  forex: [
    { sym: "EUR/USD", name: "Euro / Dollar", price: 1.0842, change: -0.21, seed: 19 },
    { sym: "GBP/USD", name: "Sterling / Dollar", price: 1.2718, change: 0.34, seed: 38 },
    { sym: "USD/JPY", name: "Dollar / Yen", price: 157.24, change: 0.58, seed: 47 },
    { sym: "AUD/USD", name: "Aussie / Dollar", price: 0.6634, change: -0.44, seed: 61 },
    { sym: "XAU/USD", name: "Gold / Dollar", price: 2398.5, change: 0.72, seed: 83 },
  ],
};

/* Rows cascade in on every tab change rather than the panel fading as one
   block - it reads like a book repopulating instead of a slide swap. */
const rowList = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.04 } },
  exit: { transition: { staggerChildren: 0.02, staggerDirection: -1 } },
};

const rowItem = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

const TABS = [
  { id: "crypto", label: "Crypto" },
  { id: "stocks", label: "Stocks" },
  { id: "forex", label: "Forex" },
];

// Deterministic PRNG — the same seed always draws the same sparkline, so the
// chart does not reshuffle on every re-render or tab switch.
const rng = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const W = 96;
const H = 30;
const POINTS = 22;

// Builds a jittered walk whose overall slope matches the sign of `change`,
// so a green row always trends up and a red row always trends down.
const sparkPath = (seed, change) => {
  const next = rng(seed);
  const drift = change >= 0 ? 1 : -1;
  const values = [];

  for (let i = 0; i < POINTS; i++) {
    const trend = (i / (POINTS - 1)) * drift;
    values.push(trend * 0.7 + (next() - 0.5) * 0.55);
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = 3;

  return values
    .map((v, i) => {
      const x = (i / (POINTS - 1)) * W;
      const y = H - pad - ((v - min) / span) * (H - pad * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
};

const fmtPrice = (n) =>
  n >= 1000
    ? n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : n.toFixed(n < 10 ? 4 : 2);

const Markets = () => {
  const [tab, setTab] = useState("crypto");
  const rows = MARKETS[tab];

  // Recomputed per tab rather than per render, and keyed by seed so the paths
  // stay identical whenever you come back to a tab.
  const paths = useMemo(
    () => rows.map((r) => sparkPath(r.seed, r.change)),
    [rows],
  );

  return (
    <section className="nx-sec markets-sec" id="markets">
      <div className="nx-sec-glow nx-sec-glow--tl" />
      <div className="container">
        <div className="nx-head nx-reveal">
          <span className="nx-eyebrow">
            <span className="nx-eyebrow-dot" />
            Markets
          </span>
          <h2 className="nx-title">
            One account. <span className="nx-grad">Every major market.</span>
          </h2>
          <p className="nx-sub">
            Move between crypto, equities and FX without moving your money.
            Positions settle into the same balance, so your buying power is
            never stranded on the wrong desk.
          </p>
        </div>

        <div className="markets-tabs nx-reveal" role="tablist" aria-label="Market categories">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`markets-tab ${tab === t.id ? "is-active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {tab === t.id && (
                <motion.span
                  layoutId="markets-tab-pill"
                  className="markets-tab-pill"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span className="markets-tab-text">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="markets-panel nx-reveal">
          <div className="markets-head" aria-hidden="true">
            <span>Asset</span>
            <span className="markets-num">Price</span>
            <span className="markets-num">24h</span>
            <span className="markets-trend">Last 24h</span>
            {/* Carries the action class so it is dropped alongside the Trade
                column — otherwise the header keeps a 4th cell in a 3-column
                grid and wraps onto a second line. */}
            <span className="markets-action" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              role="tabpanel"
              variants={rowList}
              initial="hidden"
              animate="show"
              exit="exit"
            >
              {rows.map((r, i) => {
                const up = r.change >= 0;
                return (
                  <motion.div className="markets-row" key={r.sym} variants={rowItem}>
                    <div className="markets-asset">
                      <span className="markets-badge">{r.sym.slice(0, 1)}</span>
                      <span className="markets-names">
                        <span className="markets-sym">{r.sym}</span>
                        <span className="markets-name">{r.name}</span>
                      </span>
                    </div>

                    <span className="markets-num markets-price">
                      {fmtPrice(r.price)}
                    </span>

                    <span className="markets-num">
                      <span className={`markets-chip ${up ? "is-up" : "is-down"}`}>
                        {up ? "▲" : "▼"} {Math.abs(r.change).toFixed(2)}%
                      </span>
                    </span>

                    <span className="markets-trend">
                      <svg
                        width={W}
                        height={H}
                        viewBox={`0 0 ${W} ${H}`}
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d={paths[i]}
                          stroke={up ? "var(--primary)" : "var(--accent-red)"}
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>

                    <span className="markets-action">
                      <a href="/register" className="markets-trade">
                        Trade
                      </a>
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        <p className="markets-note nx-reveal">
          Prices shown are indicative and for illustration only.
        </p>
      </div>
    </section>
  );
};

export default Markets;
