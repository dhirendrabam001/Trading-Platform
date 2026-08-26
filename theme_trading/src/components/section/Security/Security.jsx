import "./Security.css";

const PILLARS = [
  {
    title: "Segregated client funds",
    text: "Your balance is held in dedicated client accounts, never mixed with operating capital.",
  },
  {
    title: "Cold storage by default",
    text: "The large majority of crypto reserves sit in offline multi-signature custody.",
  },
  {
    title: "Two-factor everywhere",
    text: "Authenticator or hardware key on login, withdrawals and every device you add.",
  },
  {
    title: "Withdrawal allowlists",
    text: "Lock payouts to addresses you have pre-approved, with a cooling-off period on changes.",
  },
  {
    title: "Independent audits",
    text: "Regular third-party penetration testing and published proof-of-reserves attestations.",
  },
  {
    title: "Real-time monitoring",
    text: "Anomalous access is flagged and challenged before an order or transfer is accepted.",
  },
];

const Security = () => (
  <section className="nx-sec security-sec" id="security">
    <div className="container">
      <div className="row align-items-center g-5">
        <div className="col-lg-5">
          <div className="nx-head nx-head--left nx-reveal">
            <span className="nx-eyebrow">
              <span className="nx-eyebrow-dot" />
              Security
            </span>
            <h2 className="nx-title">
              Your capital, <span className="nx-grad">guarded like ours.</span>
            </h2>
            <p className="nx-sub">
              Custody, access control and monitoring are handled to the standard
              a professional desk expects — because the same controls protect
              our own book.
            </p>
          </div>

          <div className="security-seal nx-reveal">
            <span className="security-seal-ring" aria-hidden="true">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3 5 6v5.5c0 4.2 2.9 8.1 7 9.5 4.1-1.4 7-5.3 7-9.5V6l-7-3Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </span>
            <div>
              <p className="security-seal-title">Insured custody partner</p>
              <p className="security-seal-text">
                Held with a qualified custodian carrying commercial crime cover.
              </p>
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="security-grid">
            {PILLARS.map((p) => (
              <article className="nx-card security-item nx-reveal" key={p.title}>
                <span className="security-item-mark" aria-hidden="true">
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                </span>
                <h3 className="security-item-title">{p.title}</h3>
                <p className="security-item-text">{p.text}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default Security;
