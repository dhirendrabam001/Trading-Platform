import React, { useState } from "react";
import "./LiquidityCard.css";
import { FiSearch } from "react-icons/fi";
import eth from "/Images/ethereum-eth-logo.svg";
import usdc from "/Images/usd-coin-usdc-logo.svg";
import btc from "/Images/bitcoin-btc-logo.svg";
import usdt from "/Images/tether-usdt-logo.svg";

const liquidityPools = [
  {
    id: 1,
    name: "ETH-USDC",
    protocol: "Uniswap V3",
    risk: "LOW RISK",
    tvl: "$245.6M",
    volume: "$89.2M",
    apy: "156.2%",
    position: "$125,432",
    action: "Manage",
    icons: [eth, usdc],
  },
  {
    id: 2,
    name: "WBTC-ETH",
    protocol: "Curve",
    risk: "LOW RISK",
    tvl: "$567.8M",
    volume: "$45.6M",
    apy: "18.4%",
    position: "-",
    action: "Details",
    icons: [btc, eth],
  },
  {
    id: 3,
    name: "3Pool",
    protocol: "Curve",
    risk: "LOW RISK",
    tvl: "$1.2B",
    volume: "$234.5M",
    apy: "12.4%",
    position: "$156,789",
    action: "Manage",
    icons: [usdc, usdt, eth],
  },
];

const LiquidityCard = () => {
  const [active, setActive] = useState("All Pools");

  return (
    <div className="container-fluid py-4 liquidity-dashboard">
      {/* Header */}
      <div className="liquidity-header">
        <div>
          <span className="section-badge">DeFi Dashboard</span>
          <h2 className="section-title">Liquidity Pools</h2>
          <p className="section-subtitles">
            Discover high-performing liquidity pools across multiple blockchains
            and manage your positions efficiently.
          </p>
        </div>
        <button className="btn-primary-create">+ Create Position</button>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input type="text" placeholder="Search pools..." />
        </div>

        <div className="filter-group">
          {["All Pools", "Stable", "Volatile", "Concentrated"].map((item) => (
            <button
              key={item}
              className={`filter-btn ${active === item ? "active" : ""}`}
              onClick={() => setActive(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="row g-3">
        {liquidityPools.map((pool) => (
          <div className="col-12 col-md-6 col-xl-4" key={pool.id}>
            <div className="liquidity-card">
              {/* Card Header */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="token-group">
                  {pool.icons.map((icon, i) => (
                    <img key={i} src={icon} alt="" className="token-icon" />
                  ))}
                </div>
                <span className="risk-badge">{pool.risk}</span>
              </div>

              {/* Title Info */}
              <div className="pool-info-block">
                <h3 className="pool-title">{pool.name}</h3>
                <p className="pool-protocol">{pool.protocol}</p>
              </div>

              {/* Grid-based Stats Block (No bloated margins) */}
              <div className="stats-grid">
                <div className="stats-item">
                  <span className="stats-label">TVL</span>
                  <span className="stats-val">{pool.tvl}</span>
                </div>

                <div className="stats-item">
                  <span className="stats-label">Volume 24h</span>
                  <span className="stats-val">{pool.volume}</span>
                </div>

                <div className="stats-item">
                  <span className="stats-label">APY</span>
                  <span className="stats-val text-primary">{pool.apy}</span>
                </div>

                <div className="stats-item">
                  <span className="stats-label">Your Position</span>
                  <span className="stats-val">{pool.position}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="card-actions">
                <button className="btn-add">Add Liquidity</button>
                <button className="btn-manage">{pool.action}</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiquidityCard;
