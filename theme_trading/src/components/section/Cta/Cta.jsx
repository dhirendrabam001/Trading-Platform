import "./Cta.css";

const Cta = () => (
  <section className="nx-sec nx-sec--tight cta-sec">
    <div className="container">
      <div className="cta-panel nx-reveal">
        <div className="cta-orb cta-orb--a" aria-hidden="true" />
        <div className="cta-orb cta-orb--b" aria-hidden="true" />

        <div className="cta-inner">
          <span className="nx-eyebrow">
            <span className="nx-eyebrow-dot" />
            Ready when you are
          </span>

          <h2 className="nx-title cta-title">
            Open an account and{" "}
            <span className="nx-grad">trade within minutes.</span>
          </h2>

          <p className="nx-sub cta-sub">
            No minimum deposit, no monthly fee on the Starter tier, and every
            market on one balance from day one.
          </p>

          <div className="cta-actions">
            <a href="/register" className="nx-btn nx-btn-primary">
              Create free account &rarr;
            </a>
            <a href="/login" className="nx-btn nx-btn-ghost">
              Sign in
            </a>
          </div>

          <p className="cta-fine">
            Trading involves risk to your capital. Past performance does not
            guarantee future results.
          </p>
        </div>
      </div>
    </div>
  </section>
);

export default Cta;
