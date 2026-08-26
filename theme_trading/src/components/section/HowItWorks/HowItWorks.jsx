import "./HowItWorks.css";

const STEPS = [
  {
    n: "01",
    title: "Open your account",
    text: "Sign up with an email and complete identity verification. Most accounts are approved in under five minutes.",
  },
  {
    n: "02",
    title: "Fund your wallet",
    text: "Deposit by bank transfer, card or crypto. Transfers land in the same balance you trade every market from.",
  },
  {
    n: "03",
    title: "Place your first trade",
    text: "Pick a market, size the position and send the order. Fills settle to your wallet the moment they execute.",
  },
];

const HowItWorks = () => (
  <section className="nx-sec how-sec" id="how-it-works">
    <div className="container">
      <div className="nx-head nx-reveal">
        <span className="nx-eyebrow">
          <span className="nx-eyebrow-dot" />
          Getting started
        </span>
        <h2 className="nx-title">
          From sign-up to <span className="nx-grad">first fill.</span>
        </h2>
        <p className="nx-sub">
          Three steps, no paperwork queue, no waiting on a relationship manager
          to call you back.
        </p>
      </div>

      <div className="how-track nx-reveal">
        {STEPS.map((s) => (
          <article className="how-step" key={s.n}>
            <span className="how-num">{s.n}</span>
            <h3 className="nx-card-title">{s.title}</h3>
            <p className="nx-card-text">{s.text}</p>
          </article>
        ))}
      </div>

      <div className="how-cta nx-reveal">
        <a href="/register" className="nx-btn nx-btn-primary">
          Create your account &rarr;
        </a>
        <a href="/login" className="nx-btn nx-btn-ghost">
          I already have one
        </a>
      </div>
    </div>
  </section>
);

export default HowItWorks;
