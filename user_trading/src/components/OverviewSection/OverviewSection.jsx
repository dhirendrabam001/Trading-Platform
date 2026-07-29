import "./OverviewSection.css";
import AssetAllocationChart from "../AssetAllocationChart/AssetAllocationChart";

const openPositions = [
  {
    symbol: "BTC / USDT",
    iconBg: "#f7931a",
    iconText: "₿",
    type: "Long",
    size: "0.25 BTC",
    entry: "$65,125.00",
    current: "$67,245.80",
    pnl: "+$530.20",
    isUp: true,
  },
  {
    symbol: "ETH / USDT",
    iconBg: "#627eea",
    iconText: "Ξ",
    type: "Long",
    size: "2.50 ETH",
    entry: "$3,210.00",
    current: "$3,512.75",
    pnl: "+$756.88",
    isUp: true,
  },
];

const recentTrades = [
  {
    symbol: "BTC / USDT",
    iconBg: "#f7931a",
    iconText: "₿",
    type: "Buy",
    amount: "0.05 BTC",
    price: "$67,100.25",
    time: "10:24 AM",
  },
  {
    symbol: "ETH / USDT",
    iconBg: "#627eea",
    iconText: "Ξ",
    type: "Buy",
    amount: "1.20 ETH",
    price: "$3,498.60",
    time: "09:45 AM",
  },
  {
    symbol: "BNB / USDT",
    iconBg: "#f3ba2f",
    iconText: "B",
    type: "Sell",
    amount: "2.00 BNB",
    price: "$598.25",
    time: "09:15 AM",
  },
];

const AssetCell = ({ iconBg, iconText, symbol }) => (
  <div className="ov-asset">
    <span className="ov-asset-icon" style={{ backgroundColor: iconBg }}>
      {iconText}
    </span>
    <span className="ov-asset-name">{symbol}</span>
  </div>
);

const CardHeader = ({ title }) => (
  <div className="ov-card-header">
    <span className="ov-card-title">{title}</span>
    <button type="button" className="ov-view-all">
      View All
    </button>
  </div>
);

const OverviewSection = () => (
  <section className="ov-section">
    <div className="ov-grid">
      {/* ---------- Open Positions ---------- */}
      <div className="ov-card ov-card--positions">
        <CardHeader title="Open Positions" />

        <div className="ov-table-scroll">
          <table className="ov-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Type</th>
                <th>Size</th>
                <th>Entry Price</th>
                <th>Current Price</th>
                <th>P&amp;L</th>
              </tr>
            </thead>
            <tbody>
              {openPositions.map((row, index) => (
                <tr key={index}>
                  {/* data-label drives the stacked phone layout, where the
                      thead is hidden and each cell prints its own label */}
                  <td className="is-asset">
                    <AssetCell {...row} />
                  </td>
                  <td data-label="Type">
                    <span className="ov-badge ov-badge--long">{row.type}</span>
                  </td>
                  <td data-label="Size">{row.size}</td>
                  <td data-label="Entry Price">{row.entry}</td>
                  <td data-label="Current Price">{row.current}</td>
                  <td
                    data-label="P&L"
                    className={`ov-pnl ${row.isUp ? "is-positive" : "is-negative"}`}
                  >
                    {row.pnl}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------- Recent Trades ---------- */}
      <div className="ov-card ov-card--trades">
        <CardHeader title="Recent Trades" />

        <div className="ov-table-scroll">
          <table className="ov-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Price</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {recentTrades.map((row, index) => (
                <tr key={index}>
                  <td className="is-asset">
                    <AssetCell {...row} />
                  </td>
                  <td data-label="Type">
                    <span
                      className={`ov-badge ${
                        row.type === "Sell" ? "ov-badge--sell" : "ov-badge--buy"
                      }`}
                    >
                      {row.type}
                    </span>
                  </td>
                  <td data-label="Amount">{row.amount}</td>
                  <td data-label="Price">{row.price}</td>
                  <td data-label="Time" className="ov-muted">
                    {row.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------- Asset Allocation ---------- */}
      <div className="ov-card ov-card--allocation">
        <CardHeader title="Asset Allocation" />
        <AssetAllocationChart />
      </div>
    </div>
  </section>
);

export default OverviewSection;
