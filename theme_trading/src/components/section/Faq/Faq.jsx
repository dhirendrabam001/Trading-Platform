import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import "./Faq.css";

const ITEMS = [
  {
    q: "How long does it take to open an account?",
    a: "Registration takes about two minutes. Identity verification is automated for most regions and usually completes in under five, after which you can fund the account and trade immediately.",
  },
  {
    q: "What can I trade from a single balance?",
    a: "Spot crypto, listed equities and major FX pairs all draw on the same buying power. There are no internal transfers between wallets and no capital left idle on a desk you are not using.",
  },
  {
    q: "How are my funds held?",
    a: "Client money is kept in segregated accounts, separate from company operating capital. The majority of crypto reserves are held in offline multi-signature cold storage with a qualified custodian.",
  },
  {
    q: "What does it cost to withdraw?",
    a: "Bank withdrawals in your account's base currency are free. Crypto withdrawals pass through the network fee at cost, shown in full before you confirm — we do not add a margin on top.",
  },
  {
    q: "Is there an API for automated strategies?",
    a: "Yes. REST and WebSocket endpoints are available on the Professional tier, covering market data, order management and account state, with sandbox keys for testing.",
  },
  {
    q: "Can I use hardware two-factor authentication?",
    a: "Security keys and authenticator apps are both supported, and can be required for login, withdrawals and adding a new device. Withdrawal address allowlisting is available on every tier.",
  },
];

const Chevron = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const Faq = () => {
  // Single-open accordion. null means every panel is closed, which is the
  // state the section loads in.
  const [open, setOpen] = useState(null);

  return (
    <section className="nx-sec faq-sec" id="faq">
      <div className="container">
        <div className="nx-head nx-reveal">
          <span className="nx-eyebrow">
            <span className="nx-eyebrow-dot" />
            FAQ
          </span>
          <h2 className="nx-title">
            The questions we get <span className="nx-grad">most often.</span>
          </h2>
        </div>

        <div className="faq-list">
          {ITEMS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div className={`faq-item nx-reveal ${isOpen ? "is-open" : ""}`} key={item.q}>
                <button
                  type="button"
                  className="faq-q"
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${i}`}
                  id={`faq-btn-${i}`}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span>{item.q}</span>
                  <span className="faq-chev">
                    <Chevron />
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-panel-${i}`}
                      role="region"
                      aria-labelledby={`faq-btn-${i}`}
                      className="faq-a-wrap"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <p className="faq-a">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Faq;
