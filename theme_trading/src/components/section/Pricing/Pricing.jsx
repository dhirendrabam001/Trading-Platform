import { useState } from "react";
import "./Pricing.css";

/* Fees are expressed as percentages of notional. `monthly`/`yearly` hold the
   platform fee for each billing cycle — yearly is two months free, which the
   savings badge derives rather than hardcodes. */
const PLANS = [
  {
    id: "starter",
    name: "Starter",
    blurb: "For your first positions.",
    monthly: 0,
    yearly: 0,
    maker: "0.10%",
    taker: "0.15%",
    features: [
      "Spot crypto, equities and FX",
      "Market, limit and stop orders",
      "Standard charting with 40+ indicators",
      "Email support",
    ],
    cta: "Start free",
    featured: false,
  },
  {
    id: "active",
    name: "Active",
    blurb: "For traders who size up.",
    monthly: 19,
    yearly: 190,
    maker: "0.04%",
    taker: "0.07%",
    features: [
      "Everything in Starter",
      "OCO, trailing and bracket orders",
      "Full indicator suite and multi-chart layouts",
      "Level 2 depth and time & sales",
      "Priority support",
    ],
    cta: "Choose Active",
    featured: true,
  },
  {
    id: "pro",
    name: "Professional",
    blurb: "For desks and systematic flow.",
    monthly: 79,
    yearly: 790,
    maker: "0.00%",
    taker: "0.03%",
    features: [
      "Everything in Active",
      "REST and WebSocket API access",
      "Co-located low-latency routing",
      "Portfolio margin",
      "Dedicated account manager",
    ],
    cta: "Talk to sales",
    featured: false,
  },
];

const Check = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="m5 13 4 4L19 7" />
  </svg>
);

const Pricing = () => {
  const [yearly, setYearly] = useState(false);

  return (
    <section className="nx-sec pricing-sec" id="pricing">
      <div className="nx-sec-glow nx-sec-glow--br" />
      <div className="container">
        <div className="nx-head nx-reveal">
          <span className="nx-eyebrow">
            <span className="nx-eyebrow-dot" />
            Pricing
          </span>
          <h2 className="nx-title">
            Fees you can <span className="nx-grad">actually predict.</span>
          </h2>
          <p className="nx-sub">
            One published rate per tier. No payment for order flow, no widened
            spreads, no surprise withdrawal charges.
          </p>
        </div>

        <div className="pricing-toggle nx-reveal">
          <button
            type="button"
            className={`pricing-toggle-btn ${!yearly ? "is-active" : ""}`}
            onClick={() => setYearly(false)}
            aria-pressed={!yearly}
          >
            Monthly
          </button>
          <button
            type="button"
            className={`pricing-toggle-btn ${yearly ? "is-active" : ""}`}
            onClick={() => setYearly(true)}
            aria-pressed={yearly}
          >
            Yearly
            <span className="pricing-save">2 months free</span>
          </button>
        </div>

        <div className="pricing-grid">
          {PLANS.map((p) => {
            const price = yearly ? p.yearly : p.monthly;
            return (
              <article
                className={`pricing-card nx-reveal ${p.featured ? "is-featured" : ""}`}
                key={p.id}
              >
                {p.featured && <span className="pricing-flag">Most popular</span>}

                <h3 className="pricing-name">{p.name}</h3>
                <p className="pricing-blurb">{p.blurb}</p>

                <div className="pricing-price">
                  <span className="pricing-amount">${price}</span>
                  <span className="pricing-cycle">
                    {price === 0 ? "forever" : yearly ? "/ year" : "/ month"}
                  </span>
                </div>

                <div className="pricing-rates">
                  <div>
                    <span className="pricing-rate-label">Maker</span>
                    <span className="pricing-rate">{p.maker}</span>
                  </div>
                  <div>
                    <span className="pricing-rate-label">Taker</span>
                    <span className="pricing-rate">{p.taker}</span>
                  </div>
                </div>

                <ul className="pricing-list">
                  {p.features.map((f) => (
                    <li key={f}>
                      <span className="pricing-check">
                        <Check />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href="/register"
                  className={`nx-btn ${p.featured ? "nx-btn-primary" : "nx-btn-ghost"} pricing-cta`}
                >
                  {p.cta}
                </a>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
