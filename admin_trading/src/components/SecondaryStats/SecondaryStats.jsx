import React from "react";
import {
  Coins,
  ArrowRightLeft,
  MessageSquare,
  Zap,
  Activity,
} from "lucide-react";
import "./SecondaryStats.css";

const statsData = [
  {
    title: "Total Assets",
    value: "256",
    change: "+8.45%",
    isPositive: true,
    icon: <Coins size={20} />,
    theme: "emerald", // Green glow
  },
  {
    title: "Active Markets",
    value: "128",
    change: "+5.23%",
    isPositive: true,
    icon: <ArrowRightLeft size={20} />,
    theme: "blue", // Blue glow
  },
  {
    title: "Support Tickets",
    value: "23",
    change: "-2.45%",
    isPositive: false,
    icon: <MessageSquare size={20} />,
    theme: "red", // Red glow
  },
  {
    title: "API Calls (24h)",
    value: "1.2M",
    change: "+12.45%",
    isPositive: true,
    icon: <Zap size={20} />,
    theme: "amber", // Yellow/Amber glow
  },
  {
    title: "Uptime",
    value: "99.9%",
    change: "Excellent",
    isTextBadge: true,
    isPositive: true,
    icon: <Activity size={20} />,
    theme: "emerald", // Green glow
  },
];

const SecondaryStats = () => {
  return (
    <div className="row g-3 mt-1">
      <div className="col-12">
        <div className="secondary-stats-card p-3 p-md-4">
          <div className="stats-container">
            {statsData.map((stat, index) => (
              <div key={index} className="stat-item">
                {/* Glowing Icon Badge */}
                <div className={`icon-badge badge-${stat.theme}`}>
                  {stat.icon}
                </div>

                {/* Details */}
                <div className="stat-info">
                  <span className="stat-title">{stat.title}</span>
                  <div className="stat-value-group">
                    <span className="stat-value">{stat.value}</span>
                    <span
                      className={`stat-badge ${
                        stat.isPositive ? "text-positive" : "text-negative"
                      }`}
                    >
                      {stat.change}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecondaryStats;
