import { useMemo, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import {
  Star,
  Plus,
  Settings2,
  Search,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  MoreVertical,
  Sparkles,
} from "lucide-react";
import "./Watchlist.css";
import useChartTheme from "../../utils/chartTheme";

ChartJS.register(ArcElement, ChartTooltip);

/* --------------------------------------------------------------- data ---
   Module scope: these are static fixtures, so rebuilding them each render
   would only hand React new identities for no benefit.

   `spark` is 7 days of closes. Kept as plain numbers rather than a chart
   config so the row can render it as an SVG path - see Sparkline below. */

const ASSETS = [
  { rank: 1, sym: "BTC", name: "Bitcoin", key: "btc", price: 67245.8, change: 2.45, cap: "$1.32T", vol: "$32.45B", tags: ["layer1"], starred: true, spark: [63, 64, 62, 66, 65, 68, 70] },
  { rank: 2, sym: "ETH", name: "Ethereum", key: "eth", price: 3512.75, change: 1.65, cap: "$422.15B", vol: "$18.87B", tags: ["layer1", "defi"], starred: true, spark: [40, 41, 39, 43, 44, 43, 46] },
  { rank: 3, sym: "BNB", name: "BNB", key: "bnb", price: 602.45, change: 0.85, cap: "$87.45B", vol: "$1.92B", tags: ["layer1"], starred: true, spark: [30, 31, 33, 32, 34, 33, 35] },
  { rank: 4, sym: "SOL", name: "Solana", key: "sol", price: 142.35, change: 1.25, cap: "$66.21B", vol: "$2.45B", tags: ["layer1"], starred: true, spark: [22, 24, 23, 26, 25, 27, 29] },
  { rank: 5, sym: "XRP", name: "XRP", key: "xrp", price: 0.5987, change: -0.35, cap: "$33.45B", vol: "$1.15B", tags: ["layer1"], starred: false, spark: [30, 29, 30, 28, 27, 28, 26] },
  { rank: 6, sym: "ADA", name: "Cardano", key: "ada", price: 0.4567, change: 0.78, cap: "$16.32B", vol: "$612.45M", tags: ["layer1"], starred: false, spark: [18, 19, 18, 20, 21, 20, 22] },
  { rank: 7, sym: "DOGE", name: "Dogecoin", key: "doge", price: 0.1234, change: 2.15, cap: "$17.88B", vol: "$1.02B", tags: ["meme"], starred: false, spark: [12, 13, 12, 15, 14, 16, 18] },
  { rank: 8, sym: "MATIC", name: "Polygon", key: "matic", price: 0.6234, change: -0.45, cap: "$5.82B", vol: "$245.78M", tags: ["layer2"], starred: false, spark: [24, 23, 24, 22, 23, 21, 20] },
  { rank: 9, sym: "AVAX", name: "Avalanche", key: "avax", price: 35.42, change: 3.12, cap: "$13.45B", vol: "$488.2M", tags: ["layer1"], starred: false, spark: [26, 27, 29, 28, 31, 32, 34] },
  { rank: 10, sym: "LINK", name: "Chainlink", key: "link", price: 16.25, change: 4.32, cap: "$9.54B", vol: "$412.6M", tags: ["defi"], starred: true, spark: [20, 21, 23, 22, 25, 27, 29] },
  { rank: 11, sym: "DOT", name: "Polkadot", key: "dot", price: 7.12, change: -1.24, cap: "$9.12B", vol: "$225.4M", tags: ["layer1"], starred: false, spark: [28, 27, 28, 26, 25, 24, 24] },
  { rank: 12, sym: "UNI", name: "Uniswap", key: "uni", price: 7.25, change: -5.25, cap: "$4.35B", vol: "$186.3M", tags: ["defi"], starred: false, spark: [32, 31, 29, 27, 26, 24, 22] },
  { rank: 13, sym: "ARB", name: "Arbitrum", key: "arb", price: 1.12, change: 2.86, cap: "$3.62B", vol: "$298.1M", tags: ["layer2"], starred: false, spark: [16, 17, 16, 19, 20, 21, 23] },
  { rank: 14, sym: "OP", name: "Optimism", key: "op", price: 2.34, change: 1.94, cap: "$2.51B", vol: "$164.9M", tags: ["layer2"], starred: false, spark: [18, 19, 18, 20, 22, 21, 23] },
  { rank: 15, sym: "AAVE", name: "Aave", key: "aave", price: 94.6, change: 3.48, cap: "$1.41B", vol: "$142.7M", tags: ["defi"], starred: false, spark: [21, 22, 24, 23, 26, 27, 28] },
  { rank: 16, sym: "SHIB", name: "Shiba Inu", key: "shib", price: 0.0000241, change: -2.11, cap: "$14.2B", vol: "$521.8M", tags: ["meme"], starred: false, spark: [26, 25, 26, 24, 23, 22, 21] },
  { rank: 17, sym: "LTC", name: "Litecoin", key: "ltc", price: 85.12, change: -2.98, cap: "$6.35B", vol: "$342.5M", tags: ["layer1"], starred: false, spark: [30, 29, 30, 28, 26, 25, 24] },
  { rank: 18, sym: "ATOM", name: "Cosmos", key: "atom", price: 9.42, change: 0.62, cap: "$3.68B", vol: "$128.4M", tags: ["layer1"], starred: false, spark: [19, 20, 19, 21, 20, 22, 22] },
  { rank: 19, sym: "PEPE", name: "Pepe", key: "pepe", price: 0.0000112, change: 8.24, cap: "$4.71B", vol: "$894.6M", tags: ["meme"], starred: false, spark: [12, 14, 13, 17, 19, 22, 26] },
  { rank: 20, sym: "MKR", name: "Maker", key: "mkr", price: 2412.5, change: -1.08, cap: "$2.24B", vol: "$96.2M", tags: ["defi"], starred: false, spark: [27, 26, 27, 25, 25, 24, 24] },
  { rank: 21, sym: "CRV", name: "Curve DAO", key: "crv", price: 0.4123, change: -3.64, cap: "$512.4M", vol: "$78.5M", tags: ["defi"], starred: false, spark: [24, 23, 22, 21, 20, 18, 17] },
  { rank: 22, sym: "IMX", name: "Immutable", key: "imx", price: 1.84, change: 5.72, cap: "$2.76B", vol: "$112.3M", tags: ["layer2"], starred: false, spark: [15, 16, 18, 17, 21, 23, 25] },
  { rank: 23, sym: "WIF", name: "dogwifhat", key: "wif", price: 2.41, change: 6.18, cap: "$2.41B", vol: "$402.7M", tags: ["meme"], starred: false, spark: [14, 15, 17, 16, 20, 22, 24] },
  { rank: 24, sym: "NEAR", name: "NEAR Protocol", key: "near", price: 6.28, change: 1.42, cap: "$6.84B", vol: "$254.1M", tags: ["layer1"], starred: false, spark: [20, 21, 20, 22, 23, 22, 24] },
];

/* Asset-brand colours. Deliberately literal and theme-independent: these
   identify a coin, not a surface, so bitcoin stays orange in both themes. */
const COIN_COLORS = {
  btc: "#f7931a", eth: "#627eea", bnb: "#f3ba2f", sol: "#14f195",
  xrp: "#5c6773", ada: "#0033ad", doge: "#c2a633", matic: "#8247e5",
  avax: "#e84142", link: "#2a5ada", dot: "#e6007a", uni: "#ff007a",
  arb: "#28a0f0", op: "#ff0420", aave: "#b6509e", shib: "#e12d24",
  ltc: "#7a7f83", atom: "#2e3148", pepe: "#3d8130", mkr: "#1aab9b",
  crv: "#3465a4", imx: "#0d6ef9", wif: "#c8956d", near: "#3d3d3d",
};

const TABS = [
  { id: "all", label: "All Assets" },
  { id: "gainers", label: "Top Gainers" },
  { id: "losers", label: "Top Losers" },
  { id: "defi", label: "DeFi" },
  { id: "layer1", label: "Layer 1" },
  { id: "layer2", label: "Layer 2" },
  { id: "meme", label: "Meme" },
];

const ALLOCATION = [
  { label: "BTC", pct: 43.2, color: "#f7931a" },
  { label: "ETH", pct: 17.2, color: "#627eea" },
  { label: "BNB", pct: 8.7, color: "#f3ba2f" },
  { label: "SOL", pct: 6.1, color: "#14f195" },
  { label: "XRP", pct: 4.5, color: "#5c6773" },
  { label: "Others", pct: 20.3, color: "#6b7280" },
];

const TOP_MOVERS = [
  { pair: "BTC / USDT", key: "btc", sym: "B", price: "$67,245.80", change: 2.45 },
  { pair: "ETH / USDT", key: "eth", sym: "E", price: "$3,512.75", change: 1.65 },
  { pair: "DOGE / USDT", key: "doge", sym: "D", price: "$0.1234", change: 2.15 },
  { pair: "XRP / USDT", key: "xrp", sym: "X", price: "$0.5987", change: -0.35 },
];

const PAGE_SIZES = [8, 12, 24];

/* ------------------------------------------------------------ helpers ---*/

const formatPrice = (value) =>
  value >= 1
    ? `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : // Sub-dollar coins need their significant digits, not 2 decimals -
      // $0.0000241 must not round to $0.00
      `$${value.toPrecision(3)}`;

/* --- Series detail -------------------------------------------------------
   Seven points draw as a few long straight runs, which reads as a diagram
   rather than as a market. These fill in the hours between the daily closes.

   Seeded, and computed once at module load, for two reasons: an unseeded
   Math.random() would redraw a different chart on every render (so a row
   would visibly change shape when you typed in the search box), and hand
   writing 24 x 44 numbers would bury the actual data. The daily closes stay
   the anchors, so each coin's real trend - and its sign - is preserved. */

const mulberry32 = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const seedFrom = (text) => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (Math.imul(hash, 31) + text.charCodeAt(i)) | 0;
  }
  return hash;
};

const densify = (anchors, count, seed) => {
  const random = mulberry32(seed);
  const span = Math.max(...anchors) - Math.min(...anchors) || 1;
  const out = [];

  for (let i = 0; i < count; i++) {
    const t = (i / (count - 1)) * (anchors.length - 1);
    const lo = Math.floor(t);
    const hi = Math.min(anchors.length - 1, lo + 1);
    // Linear between the two closes it falls between, plus intraday jitter
    const base = anchors[lo] + (anchors[hi] - anchors[lo]) * (t - lo);
    out.push(base + (random() - 0.5) * span * 0.26);
  }

  return out;
};

const SPARK_SERIES = Object.fromEntries(
  ASSETS.map((asset) => [asset.sym, densify(asset.spark, 46, seedFrom(asset.sym))]),
);

/* Inline SVG rather than a chart instance per row.
   These are decoration in a paginated, searchable table: a Chart.js canvas
   per row would be torn down and rebuilt on every keystroke in the search
   box. The path is cheap to compute, stays sharp at any DPI, and takes its
   colour from CSS via currentColor - so line, fill and glow all re-theme for
   free with no redraw. Chart.js still earns its place on the doughnut below,
   where arcs and hit-testing are real work. */
const Sparkline = ({ points, up, id }) => {
  const W = 108;
  const H = 42;
  const PAD = 4;

  const { line, area } = useMemo(() => {
    const min = Math.min(...points);
    const max = Math.max(...points);
    const span = max - min || 1; // a flat series would divide by zero
    const stepX = W / (points.length - 1);

    const coords = points.map((value, i) => {
      const x = i * stepX;
      const y = H - PAD - ((value - min) / span) * (H - PAD * 2);
      return [x, y];
    });

    const linePath = coords
      .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`)
      .join(" ");

    // Same path, dropped to the baseline and closed, so the fill sits under
    // the line instead of being a second approximation of it
    const areaPath = `${linePath} L${W} ${H} L0 ${H} Z`;

    return { line: linePath, area: areaPath };
  }, [points]);

  const gradientId = `wl-spark-${id}`;

  return (
    <svg
      className={`wl-spark ${up ? "is-up" : "is-down"}`}
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* currentColor on a stop resolves against the gradient's OWN
            inherited colour, not the element referencing it - which works
            here precisely because the gradient lives inside this svg, and
            this svg is the element carrying is-up / is-down. */}
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
          <stop offset="55%" stopColor="currentColor" stopOpacity="0.1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>

      <path className="wl-spark-area" d={area} fill={`url(#${gradientId})`} />
      <path
        className="wl-spark-line"
        d={line}
        fill="none"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const Change = ({ value }) => {
  const up = value >= 0;
  return (
    <span className={`wl-change ${up ? "is-up" : "is-down"}`}>
      {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {up ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  );
};

/* `size` only emits a modifier when it is not the default - a wl-coin--md
   class that matched no rule would just be noise in the DOM. */
const CoinMark = ({ coinKey, sym, size }) => (
  <span
    className={`wl-coin${size ? ` wl-coin--${size}` : ""}`}
    style={{ backgroundColor: COIN_COLORS[coinKey] || "#6b7280" }}
    aria-hidden="true"
  >
    {sym.charAt(0)}
  </span>
);

/* ---------------------------------------------------------- component ---*/

const Watchlist = () => {
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [density, setDensity] = useState("comfortable");
  const [starred, setStarred] = useState(() =>
    ASSETS.filter((a) => a.starred).map((a) => a.sym),
  );

  const chart = useChartTheme();

  const toggleStar = (sym) =>
    setStarred((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym],
    );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return ASSETS.filter((asset) => {
      if (q && !`${asset.sym} ${asset.name}`.toLowerCase().includes(q)) {
        return false;
      }
      if (tab === "gainers") return asset.change > 0;
      if (tab === "losers") return asset.change < 0;
      if (tab !== "all") return asset.tags.includes(tab);
      return true;
    }).sort((a, b) => {
      // Gainers/losers read as leaderboards, so order them by magnitude
      if (tab === "gainers") return b.change - a.change;
      if (tab === "losers") return a.change - b.change;
      return a.rank - b.rank;
    });
  }, [tab, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  // Filtering can shrink the list below the current page; clamp rather than
  // render an empty table until the user notices
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * pageSize;
  const rows = filtered.slice(start, start + pageSize);

  const resetTo = (updater) => {
    updater();
    setPage(1);
  };

  const doughnutData = {
    labels: ALLOCATION.map((a) => a.label),
    datasets: [
      {
        data: ALLOCATION.map((a) => a.pct),
        backgroundColor: ALLOCATION.map((a) => a.color),
        borderWidth: 0,
        // A gap between arcs reads cleaner than hairline borders, which
        // would need to change colour with the theme
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
        callbacks: { label: (item) => `${item.parsed}%` },
      },
    },
  };

  return (
    <section className="wl-page">
      {/* ============================ HEADER =========================== */}
      <header className="wl-header">
        <div className="wl-heading">
          <span className="wl-heading-icon">
            <Star size={20} />
          </span>
          <div>
            <h1 className="wl-title">Watchlist</h1>
            <p className="wl-subtitle">
              Track your favorite cryptocurrencies and never miss an
              opportunity.
            </p>
          </div>
        </div>

        <dl className="wl-summary">
          <div>
            <dt>Total Assets</dt>
            <dd>{ASSETS.length}</dd>
          </div>
          <div>
            <dt>Total Market Cap</dt>
            <dd>$2.45T</dd>
          </div>
          <div>
            <dt>24h Change</dt>
            <dd className="wl-up">+2.45%</dd>
          </div>
        </dl>

        <div className="wl-header-actions">
          <button type="button" className="wl-btn wl-btn--primary">
            <Plus size={15} /> Add Asset
          </button>
          <button type="button" className="wl-btn wl-btn--ghost">
            <Settings2 size={15} /> Manage Watchlist
          </button>
        </div>
      </header>

      {/* ============================= GRID ============================ */}
      <div className="wl-grid">
        {/* ------------------------ ASSET TABLE ----------------------- */}
        <div className="wl-card wl-table-card">
          <div className="wl-toolbar">
            <div className="wl-tabs" role="tablist" aria-label="Filter assets">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  className={`wl-tab ${tab === t.id ? "is-active" : ""}`}
                  onClick={() => resetTo(() => setTab(t.id))}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="wl-tools">
              <select className="wl-select" aria-label="View preset">
                <option>Default View</option>
                <option>Compact View</option>
                <option>Performance View</option>
              </select>

              <div
                className="wl-density"
                role="group"
                aria-label="Row density"
              >
                <button
                  type="button"
                  className={density === "comfortable" ? "is-active" : ""}
                  onClick={() => setDensity("comfortable")}
                  aria-label="Comfortable rows"
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  type="button"
                  className={density === "compact" ? "is-active" : ""}
                  onClick={() => setDensity("compact")}
                  aria-label="Compact rows"
                >
                  <List size={14} />
                </button>
              </div>

              <div className="wl-search">
                <Search size={14} />
                <input
                  type="search"
                  value={query}
                  placeholder="Search in watchlist..."
                  aria-label="Search in watchlist"
                  onChange={(e) => resetTo(() => setQuery(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="wl-table-scroll">
            <table className={`wl-table is-${density}`}>
              <thead>
                <tr>
                  <th className="wl-col-rank">#</th>
                  <th>Asset</th>
                  <th className="wl-num">Price</th>
                  <th className="wl-num">24h Change</th>
                  <th className="wl-num">Market Cap</th>
                  <th className="wl-num">24h Volume</th>
                  <th className="wl-col-chart">7D Chart</th>
                  <th className="wl-col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((asset) => (
                  <tr key={asset.sym}>
                    <td data-label="#" className="wl-col-rank wl-muted">
                      {asset.rank}
                    </td>
                    <td data-label="Asset" className="wl-cell-asset">
                      <CoinMark coinKey={asset.key} sym={asset.sym} />
                      <span className="wl-asset-text">
                        <b>{asset.sym}</b>
                        <small>{asset.name}</small>
                      </span>
                    </td>
                    <td data-label="Price" className="wl-num wl-strong">
                      {formatPrice(asset.price)}
                    </td>
                    <td data-label="24h Change" className="wl-num">
                      <Change value={asset.change} />
                    </td>
                    <td data-label="Market Cap" className="wl-num">
                      {asset.cap}
                    </td>
                    <td data-label="24h Volume" className="wl-num">
                      {asset.vol}
                    </td>
                    <td data-label="7D Chart" className="wl-col-chart">
                      <Sparkline
                        points={SPARK_SERIES[asset.sym]}
                        up={asset.change >= 0}
                        id={asset.sym}
                      />
                    </td>
                    <td data-label="Actions" className="wl-col-actions">
                      <div className="wl-actions">
                        <button
                          type="button"
                          className={`wl-star ${starred.includes(asset.sym) ? "is-on" : ""}`}
                          onClick={() => toggleStar(asset.sym)}
                          aria-pressed={starred.includes(asset.sym)}
                          aria-label={
                            starred.includes(asset.sym)
                              ? `Remove ${asset.name} from watchlist`
                              : `Add ${asset.name} to watchlist`
                          }
                        >
                          <Star size={15} />
                        </button>
                        <button
                          type="button"
                          className="wl-kebab"
                          aria-label={`More options for ${asset.name}`}
                        >
                          <MoreVertical size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {rows.length === 0 && (
                  <tr className="wl-empty-row">
                    <td colSpan={8}>
                      <div className="wl-empty">
                        <Search size={20} />
                        <p>No assets match this filter.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="wl-table-foot">
            <span className="wl-muted">
              {filtered.length === 0
                ? "No assets"
                : `Showing ${start + 1} to ${Math.min(start + pageSize, filtered.length)} of ${filtered.length} assets`}
            </span>

            <div className="wl-pager">
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

            <label className="wl-rows">
              <span className="wl-muted">Rows per page:</span>
              <select
                className="wl-select"
                value={pageSize}
                onChange={(e) => resetTo(() => setPageSize(Number(e.target.value)))}
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
        <aside className="wl-side">
          <div className="wl-card wl-overview">
            <h2 className="wl-card-title">Watchlist Overview</h2>

            <div className="wl-overview-body">
              <div className="wl-donut">
                <Doughnut data={doughnutData} options={doughnutOptions} />
                <div className="wl-donut-center">
                  <strong>$2.45T</strong>
                  <span>Total Market Cap</span>
                </div>
              </div>

              <ul className="wl-legend">
                {ALLOCATION.map((slice) => (
                  <li key={slice.label}>
                    <i style={{ backgroundColor: slice.color }} />
                    <span>{slice.label}</span>
                    <b>{slice.pct}%</b>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="wl-card wl-movers">
            <h2 className="wl-card-title">
              Top Movers <span className="wl-muted">(24h)</span>
            </h2>

            <ul className="wl-mover-list">
              {TOP_MOVERS.map((mover) => (
                <li key={mover.pair}>
                  <CoinMark coinKey={mover.key} sym={mover.sym} size="sm" />
                  <span className="wl-mover-text">
                    <b>{mover.pair}</b>
                    <small>{mover.price}</small>
                  </span>
                  <Change value={mover.change} />
                </li>
              ))}
            </ul>
          </div>

          <div className="wl-card wl-insight">
            <h2 className="wl-card-title">
              <span className="wl-insight-icon">
                <Sparkles size={14} />
              </span>
              AI Market Insight
            </h2>
            <p>
              Bitcoin is showing strong bullish momentum with increased trading
              volume in the last 24 hours.
            </p>
            <button type="button" className="wl-report">
              View Full Report <ArrowRight size={14} />
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default Watchlist;
