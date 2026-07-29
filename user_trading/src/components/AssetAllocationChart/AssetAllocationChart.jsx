import "./AssetAllocationChart.css"; // The shared CSS file contains chart variables

// Mock allocation — totals the $847,234.56 shown in PortfolioPerformance
const defaultData = [
  {
    name: "Bitcoin",
    symbol: "BTC",
    value: 40.2,
    usdValue: 340588.29,
    color: "#f59e0b",
  },
  {
    name: "Ethereum",
    symbol: "ETH",
    value: 25.1,
    usdValue: 212655.87,
    color: "#3b82f6",
  },
  {
    name: "Solana",
    symbol: "SOL",
    value: 15.3,
    usdValue: 129626.89,
    color: "#22c55e",
  },
  {
    name: "BNB",
    symbol: "BNB",
    value: 8.7,
    usdValue: 73709.41,
    color: "#eab308",
  },
  {
    name: "Others",
    value: 10.7,
    usdValue: 90654.1,
    color: "#6b7280",
  },
];

// --- Chart Dimensions ---
// The 70/90 inner/outer radii are drawn as a single stroked circle, so the
// 10px corner radius of the original design becomes a round line cap.
const SIZE = 200;
const CENTER = SIZE / 2;
const RADIUS = 80; // midpoint between the inner and outer radius
const STROKE = 20; // outerRadius - innerRadius
const GAP = 8; // circumference px between segments
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Define color mapping from root variables
const colorMap = {
  "#f59e0b": "var(--accent-orange)", // Bitcoin
  "#3b82f6": "var(--accent-blue)", // Ethereum
  "#22c55e": "var(--accent-green-bright)", // Solana (bright green needed for visibility)
  "#eab308": "var(--accent-yellow)", // BNB
  "#6b7280": "var(--text-muted)", // Others
};

const resolveColor = (color) => colorMap[color] || color; // Use mapped color or fallback

const AssetAllocationChart = ({ data = defaultData }) => {
  const items = Array.isArray(data) ? data.filter(Boolean) : [];

  if (items.length === 0) return null;

  const totalWeight = items.reduce((sum, item) => sum + (item.value || 0), 0);

  // --- Calculate Total Portfolio Value ---
  const totalValue = items.reduce((sum, item) => sum + (item.usdValue || 0), 0);
  const formattedTotal = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(totalValue);

  // --- Compute Arcs ---
  // Walk the ring once, turning each weight into a dash along the circle.
  const isSingle = items.length === 1;
  let travelled = 0;

  const segments = items.map((item) => {
    const arcLength =
      totalWeight > 0 ? ((item.value || 0) / totalWeight) * CIRCUMFERENCE : 0;
    // Round caps overhang STROKE/2 at both ends, so shorten the dash to match.
    const dash = Math.max(arcLength - GAP - STROKE, 0.01);
    const segment = {
      dash,
      dashOffset: -(travelled + (GAP + STROKE) / 2),
      color: resolveColor(item.color),
    };
    travelled += arcLength;
    return segment;
  });

  return (
    <div className="chart-and-legend-container">
      <div className="chart-wrapper">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {/* Rotate so the first segment starts at 12 o'clock */}
          <g transform={`rotate(-90 ${CENTER} ${CENTER})`}>
            {segments.map((segment, index) => (
              <circle
                key={index}
                className="donut-segment"
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                fill="none"
                stroke={segment.color}
                strokeWidth={STROKE}
                strokeLinecap={isSingle ? "butt" : "round"}
                strokeDasharray={
                  isSingle
                    ? undefined
                    : `${segment.dash} ${CIRCUMFERENCE - segment.dash}`
                }
                strokeDashoffset={isSingle ? undefined : segment.dashOffset}
              />
            ))}
          </g>

          {/* --- Center Text (Total Label & Value) --- */}
          <g textAnchor="middle" dominantBaseline="middle">
            <text className="chart-label-text" x={CENTER} y={CENTER - 10}>
              Total
            </text>
            <text className="chart-value-text" x={CENTER} y={CENTER + 15}>
              {formattedTotal}
            </text>
          </g>
        </svg>
      </div>
      <div className="legend-wrapper">
        {items.map((item, index) => (
          <div key={index} className="legend-item">
            <span
              className="legend-dot"
              style={{ backgroundColor: resolveColor(item.color) }}
            />
            <span className="legend-name">
              {item.symbol ? `${item.name} (${item.symbol})` : item.name}
            </span>
            <span className="legend-percentage">
              {Number(item.value || 0).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssetAllocationChart;
