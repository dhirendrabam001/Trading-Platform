import { useEffect, useState } from "react";
import "./PortfolioHealth.css";

const healthData = [
  {
    id: "diversification",
    percentage: 80,
    label: "Diversification",
    status: "Well balanced",
    gradientId: "grad-div",
    startColor: "var(--accent-purple)",
    endColor: "var(--accent-blue)",
  },
  {
    id: "risk",
    percentage: 70,
    label: "Risk Score",
    status: "Moderate",
    color: "var(--primary)",
  },
  {
    id: "yield",
    percentage: 85,
    label: "Yield Efficiency",
    status: "Optimized",
    color: "var(--accent-blue)",
  },
  {
    id: "protocol",
    percentage: 75,
    label: "Protocol Safety",
    status: "Audited",
    color: "var(--accent-orange)",
  },
];

// Reusable Counter Subcomponent
const AnimatedCounter = ({ target }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1200; // Duration matches CSS ring transitions precisely
    const increment = Math.ceil(target / (duration / 16));

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [target]);

  return <div className="percentage-display">{count}%</div>;
};

const PortfolioHealth = () => {
  const radius = 42;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;

  return (
    <section className="portfolio-main">
      <div className="portfolio-header">
        <h2>Portfolio Health</h2>
        <div className="health-badge">
          <svg
            className="badge-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          <span>Good</span>
        </div>
      </div>

      <div className="metrics-grid">
        {healthData.map((item) => {
          const strokeDashoffset =
            circumference - (item.percentage / 100) * circumference;

          return (
            <div key={item.id} className="metric-card">
              <div className="svg-container">
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <defs>
                    {item.gradientId && (
                      <linearGradient
                        id={item.gradientId}
                        x1="0%"
                        y1="100%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor={item.startColor} />
                        <stop offset="100%" stopColor={item.endColor} />
                      </linearGradient>
                    )}
                  </defs>
                  <circle
                    className="track-ring"
                    cx="50"
                    cy="50"
                    r={radius}
                    strokeWidth={strokeWidth}
                  />
                  <circle
                    className="value-ring"
                    cx="50"
                    cy="50"
                    r={radius}
                    strokeWidth={strokeWidth}
                    stroke={
                      item.gradientId ? `url(#${item.gradientId})` : item.color
                    }
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                  />
                </svg>
                {/* Dynamically counts from 0 up to target */}
                <AnimatedCounter target={item.percentage} />
              </div>

              <div className="metric-info">
                <h3>{item.label}</h3>
                <p>{item.status}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default PortfolioHealth;
