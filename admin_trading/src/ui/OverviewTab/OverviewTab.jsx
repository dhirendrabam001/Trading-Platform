import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "./OverviewTab.css";

const CHAINS = [
  { id: "all", name: "All Chains" },
  { id: "eth", name: "Ethereum", class: "eth" },
  { id: "bsc", name: "BSC", class: "bsc" },
  { id: "poly", name: "Polygon", class: "poly" },
  { id: "arb", name: "Arbitrum", class: "arb" },
  { id: "sol", name: "Solana", class: "sol" },
];

const PROTOCOLS = [
  { name: "Uniswap", value: 32, color: "var(--accent-purple)" },
  { name: "Aave", value: 25, color: "var(--accent-blue)" },
  { name: "Curve", value: 18, color: "var(--primary)" },
  { name: "Compound", value: 15, color: "var(--accent-orange)" },
  { name: "Others", value: 10, color: "var(--accent-red)" },
];

const TIMEFRAME_DATA = {
  "7D": [
    { name: "Mon", tvl: 780000 },
    { name: "Tue", tvl: 795000 },
    { name: "Wed", tvl: 810000 },
    { name: "Thu", tvl: 825000 },
    { name: "Fri", tvl: 815000 },
    { name: "Sat", tvl: 835000 },
    { name: "Sun", tvl: 848000 },
  ],
  "30D": [
    { name: "Week 1", tvl: 780000 },
    { name: "Week 2", tvl: 815000 },
    { name: "Week 3", tvl: 800000 },
    { name: "Week 4", tvl: 848000 },
  ],
  "90D": [
    { name: "Month 1", tvl: 780000 },
    { name: "Month 2", tvl: 830000 },
    { name: "Month 3", tvl: 848000 },
  ],
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-chart-tooltip">
        <p className="label">{payload[0].payload.name}</p>
        <p className="value">${(payload[0].value / 1000).toFixed(0)}K</p>
      </div>
    );
  }
  return null;
};

const OverviewTab = () => {
  const [activeChain, setActiveChain] = useState("all");
  const [timeframe, setTimeframe] = useState("7D");

  return (
    <div className="tab-pane-fade animate-in">
      {/* 1. CHAIN SELECTOR */}
      <div className="d-flex flex-wrap gap-2 mb-4 align-items-center">
        {CHAINS.map((chain) => (
          <button
            key={chain.id}
            className={`chain-pill ${activeChain === chain.id ? "active" : ""}`}
            onClick={() => setActiveChain(chain.id)}
          >
            {chain.class && (
              <span className={`chain-dot ${chain.class}`}></span>
            )}
            {chain.name}
          </button>
        ))}
      </div>

      {/* 2. CHARTS */}
      <div className="row g-4">
        {/* LEFT COLUMN: TVL OVER TIME */}
        <div className="col-12 col-xl-7">
          <div className="card h-100 p-4 d-flex flex-column justify-content-between chart-card">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="fs-5 m-0 font-heading fw-semibold text-white">
                TVL Over Time
              </h3>
              <div className="timeframe-wrapper purple-theme">
                {["7D", "30D", "90D"].map((t) => (
                  <button
                    key={t}
                    className={`time-pill ${timeframe === t ? "active" : ""}`}
                    onClick={() => setTimeframe(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="chart-container-wrapper">
              <ResponsiveContainer width="100%" height={290}>
                <AreaChart
                  data={TIMEFRAME_DATA[timeframe]}
                  margin={{
                    top: 20,
                    right: 15,
                    left: -15,
                    bottom: 10,
                  }}
                >
                  <defs>
                    <linearGradient
                      id="tvlPurpleGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="var(--accent-purple)"
                        stopOpacity={0.42}
                      />

                      <stop
                        offset="55%"
                        stopColor="var(--accent-purple)"
                        stopOpacity={0.15}
                      />

                      <stop
                        offset="100%"
                        stopColor="var(--accent-purple)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    vertical={false}
                    horizontal={true}
                    stroke="rgba(255,255,255,.045)"
                    strokeDasharray="3 6"
                  />

                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    stroke="var(--text-muted)"
                    fontSize={12}
                    tickMargin={15}
                  />

                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    stroke="var(--text-muted)"
                    fontSize={12}
                    width={55}
                    tickFormatter={(v) => `$${v / 1000}K`}
                    domain={[770000, 850000]}
                  />

                  <Tooltip
                    cursor={{
                      stroke: "rgba(139,92,246,.4)",
                      strokeWidth: 1,
                    }}
                    content={<CustomTooltip />}
                  />

                  <Area
                    type="natural"
                    dataKey="tvl"
                    stroke="var(--accent-purple)"
                    strokeWidth={4}
                    fill="url(#tvlPurpleGradient)"
                    animationDuration={1200}
                    animationEasing="ease-out"
                    dot={{
                      r: 5,

                      fill: "var(--accent-purple)",

                      stroke: "var(--bg-primary)",

                      strokeWidth: 2,
                    }}
                    activeDot={{
                      r: 8,

                      fill: "var(--primary)",

                      stroke: "#fff",

                      strokeWidth: 2,

                      style: {
                        filter: "drop-shadow(0 0 12px rgba(139,92,246,.8))",
                      },
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PROTOCOL ALLOCATION */}
        <div className="col-12 col-xl-5">
          <div
            className="card h-100 p-4 chart-card d-flex flex-column justify-content-between"
            style={{
              minHeight: "430px",
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className="fs-5 m-0 font-heading fw-semibold text-white">
                Protocol Allocation
              </h3>
              <a
                href="#view-all"
                className="text-primary small fw-semibold transition-all"
              >
                View All
              </a>
            </div>

            <div className="row align-items-center g-3 my-auto donut-row-wrapper">
              <div className="col-12 col-sm-6 d-flex justify-content-center">
                <div className="donut-chart-container">
                  <ResponsiveContainer width="100%" height={170}>
                    <PieChart>
                      <Pie
                        data={PROTOCOLS}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={0}
                        dataKey="value"
                        animationDuration={1000}
                      >
                        {PROTOCOLS.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="col-12 col-sm-6">
                <div className="d-flex flex-column gap-2 legend-list">
                  {PROTOCOLS.map((proto) => (
                    <div
                      key={proto.name}
                      className="d-flex align-items-center justify-content-between legend-item"
                    >
                      <div className="d-flex align-items-center gap-2">
                        <span
                          className="legend-indicator"
                          style={{ backgroundColor: proto.color }}
                        ></span>
                        <span className="text-white small fw-medium">
                          {proto.name}
                        </span>
                      </div>
                      <span className="text-white fw-bold small">
                        {proto.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
