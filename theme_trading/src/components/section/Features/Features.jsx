import "./Features.css";

const ICONS = {
  bolt: "M13 2 4.5 13.2H11l-1 8.8 8.5-11.2H12l1-8.8Z",
  layers: "M12 3 3 8l9 5 9-5-9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5",
  shield: "M12 3 5 6v5.5c0 4.2 2.9 8.1 7 9.5 4.1-1.4 7-5.3 7-9.5V6l-7-3Z",
  chart: "M4 19V9m5 10V5m5 14v-7m5 7V8",
  wallet:
    "M3 8a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2M3 8v9a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-3M3 8h1m17 3h-4a2 2 0 0 0 0 4h4a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1Z",
  clock: "M12 7v5l3.2 1.9M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
};

const Icon = ({ d }) => (
  <svg
    width="21"
    height="21"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
);

const FEATURES = [
  {
    icon: "bolt",
    tone: "",
    title: "Sub-second execution",
    text: "Orders route through a co-located matching engine, so the price you click is the price you get — even when the book is moving.",
  },
  {
    icon: "layers",
    tone: "nx-ico--blue",
    title: "Every order type",
    text: "Market, limit, stop, stop-limit, OCO and trailing stops, with bracket orders that attach a target and a stop the moment you fill.",
  },
  {
    icon: "shield",
    tone: "nx-ico--violet",
    title: "Segregated custody",
    text: "Client funds are held separately from company assets, with the majority of crypto reserves kept in offline cold storage.",
  },
  {
    icon: "chart",
    tone: "nx-ico--amber",
    title: "Professional charting",
    text: "Over 100 indicators, multi-timeframe layouts and drawing tools that stay pinned to your symbols across every device.",
  },
  {
    icon: "wallet",
    tone: "",
    title: "One unified balance",
    text: "Crypto, equities and FX draw on the same buying power. No internal transfers, no capital stranded on the wrong desk.",
  },
  {
    icon: "clock",
    tone: "nx-ico--blue",
    title: "Round-the-clock access",
    text: "Crypto never closes and neither do we — with 24/5 FX coverage and pre- and post-market equity sessions.",
  },
];

const Features = () => (
  <section className="nx-sec features-sec" id="features">
    <div className="nx-sec-glow nx-sec-glow--br" />
    <div className="container">
      <div className="nx-head nx-reveal">
        <span className="nx-eyebrow">
          <span className="nx-eyebrow-dot" />
          Platform
        </span>
        <h2 className="nx-title">
          Built for traders who <span className="nx-grad">measure in ticks.</span>
        </h2>
        <p className="nx-sub">
          The infrastructure a serious desk expects, in an account you can open
          in minutes.
        </p>
      </div>

      {/* col-6 keeps two cards per row right down to the smallest phone —
          without it Bootstrap falls back to col-12 below 768px and they
          stack one at a time. */}
      <div className="row g-4">
        {FEATURES.map((f) => (
          <div className="col-6 col-lg-4" key={f.title}>
            <article className="nx-card nx-reveal">
              <span className={`nx-ico ${f.tone}`}>
                <Icon d={ICONS[f.icon]} />
              </span>
              <h3 className="nx-card-title">{f.title}</h3>
              <p className="nx-card-text">{f.text}</p>
            </article>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Features;
