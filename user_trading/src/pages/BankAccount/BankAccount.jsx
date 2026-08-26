import { useMemo, useState } from "react";
import {
  Landmark,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  Star,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  Building2,
  Globe,
  Info,
  X,
} from "lucide-react";
import "./BankAccount.css";

/* ================================================================== data ===
   Only each account's own facts are stored. Which one is DEFAULT is held as a
   single id rather than a flag on every row, because a per-row boolean is how
   a list ends up with two defaults - or none. See setDefault / removeAccount
   below, which keep that id valid. */

const INITIAL_ACCOUNTS = [
  {
    id: "b1",
    bank: "Nabil Bank",
    holder: "Dhirendra Bam",
    number: "•••• •••• 4821",
    type: "Savings",
    currency: "NPR",
    country: "Nepal",
    swift: "NARBNPKA",
    status: "Verified",
    added: "02 Jul 2025",
  },
  {
    id: "b2",
    bank: "Standard Chartered",
    holder: "Dhirendra Bam",
    number: "•••• •••• 9037",
    type: "Current",
    currency: "USD",
    country: "United Kingdom",
    swift: "SCBLGB2L",
    status: "Verified",
    added: "18 Jul 2025",
  },
  {
    id: "b3",
    bank: "Wise",
    holder: "Dhirendra Bam",
    number: "•••• •••• 1174",
    type: "Business",
    currency: "EUR",
    country: "Belgium",
    swift: "TRWIBEB1",
    status: "Pending",
    added: "11 Aug 2025",
  },
  {
    id: "b4",
    bank: "Himalayan Bank",
    holder: "D. Bam",
    number: "•••• •••• 6650",
    type: "Savings",
    currency: "NPR",
    country: "Nepal",
    swift: "HIMANPKA",
    status: "Rejected",
    added: "05 Aug 2025",
  },
];

const STATUS_META = {
  Verified: { icon: CheckCircle2, tone: "done" },
  Pending: { icon: Clock, tone: "warn" },
  Rejected: { icon: XCircle, tone: "bad" },
};

/* Only a verified account can receive a withdrawal, so only a verified
   account may be the default. Both setDefault and removeAccount read this
   one predicate. */
const isUsable = (account) => account.status === "Verified";

const WITHDRAWAL_INFO = [
  { label: "Processing time", value: "1–3 business days" },
  { label: "Withdrawal fee", value: "Free (SEPA / local)" },
  { label: "SWIFT fee", value: "$18 per transfer" },
  { label: "Minimum", value: "$50 equivalent" },
  { label: "Daily limit", value: "$50,000" },
];

/* ============================================================== helpers ===*/

/* Pick a replacement default: the first usable account that is not the one
   being removed. Returns null when nothing is eligible, which the UI treats
   as "no default set" rather than pretending one exists. */
const pickDefault = (accounts, excludeId = null) => {
  const candidate = accounts.find((a) => a.id !== excludeId && isUsable(a));
  return candidate ? candidate.id : null;
};

/* ============================================================= component ===*/

const BankAccount = () => {
  const [accounts, setAccounts] = useState(INITIAL_ACCOUNTS);
  const [defaultId, setDefaultId] = useState(() =>
    pickDefault(INITIAL_ACCOUNTS),
  );
  const [openForm, setOpenForm] = useState(false);
  const [confirming, setConfirming] = useState(null);

  const setDefault = (id) => {
    const target = accounts.find((a) => a.id === id);
    // Guard rather than trust the caller: an unverified account must never
    // become the payout destination, however the click arrived
    if (!target || !isUsable(target)) return;
    setDefaultId(id);
  };

  const removeAccount = (id) => {
    const next = accounts.filter((a) => a.id !== id);
    setAccounts(next);
    /* Removing the default would otherwise leave the id pointing at nothing,
       so promote the next usable account in the same step. */
    if (id === defaultId) setDefaultId(pickDefault(next));
    setConfirming(null);
  };

  const stats = useMemo(() => {
    const verified = accounts.filter(isUsable).length;
    return {
      total: accounts.length,
      verified,
      pending: accounts.filter((a) => a.status === "Pending").length,
      currencies: new Set(accounts.map((a) => a.currency)).size,
    };
  }, [accounts]);

  const defaultAccount = accounts.find((a) => a.id === defaultId) || null;

  const metrics = [
    {
      key: "linked",
      icon: Landmark,
      label: "Linked Accounts",
      value: String(stats.total),
      sub: `${stats.currencies} currenc${stats.currencies === 1 ? "y" : "ies"}`,
      tone: "neutral",
    },
    {
      key: "verified",
      icon: ShieldCheck,
      label: "Verified",
      value: String(stats.verified),
      sub: "Ready for withdrawals",
      tone: "up",
    },
    {
      key: "pending",
      icon: Clock,
      label: "Pending Review",
      value: String(stats.pending),
      sub: stats.pending > 0 ? "Usually 1–2 days" : "Nothing in review",
      tone: stats.pending > 0 ? "warn" : "neutral",
    },
    {
      key: "default",
      icon: Star,
      label: "Default Account",
      value: defaultAccount ? defaultAccount.currency : "None",
      sub: defaultAccount ? defaultAccount.bank : "Set one to withdraw",
      tone: defaultAccount ? "up" : "warn",
    },
  ];

  return (
    <section className="ba-page">
      {/* ============================ HEADER =========================== */}
      <header className="ba-header">
        <div className="ba-heading">
          <span className="ba-heading-icon">
            <Landmark size={19} />
          </span>
          <div>
            <h1 className="ba-title">Bank Accounts</h1>
            <p className="ba-subtitle">
              Link the accounts you withdraw to. Only verified accounts can
              receive funds.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="ba-btn ba-btn--primary"
          onClick={() => setOpenForm((v) => !v)}
          aria-expanded={openForm}
        >
          {openForm ? <X size={14} /> : <Plus size={14} />}
          {openForm ? "Cancel" : "Add Bank Account"}
        </button>
      </header>

      {/* ============================ METRICS ========================== */}
      <div className="ba-metrics">
        {metrics.map(({ key, icon: Icon, label, value, sub, tone }) => (
          <div className={`ba-card ba-metric is-${tone}`} key={key}>
            <span className="ba-metric-icon">
              <Icon size={16} />
            </span>
            <div className="ba-metric-body">
              <span className="ba-metric-label">{label}</span>
              <strong className="ba-metric-value">{value}</strong>
              <span className="ba-metric-sub">{sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ============================= GRID ============================ */}
      <div className="ba-grid">
        <div className="ba-col-main">
          {/* ------------------------- ADD FORM ---------------------- */}
          {openForm && (
            <div className="ba-card ba-form-card">
              <h2 className="ba-card-title">
                <Plus size={14} /> Add a Bank Account
              </h2>

              <div className="ba-form">
                <div className="ba-field">
                  <label htmlFor="ba-bank">Bank name</label>
                  <input id="ba-bank" type="text" placeholder="e.g. Nabil Bank" />
                </div>
                <div className="ba-field">
                  <label htmlFor="ba-holder">Account holder</label>
                  <input
                    id="ba-holder"
                    type="text"
                    placeholder="Must match your verified name"
                  />
                </div>
                <div className="ba-field">
                  <label htmlFor="ba-number">Account number / IBAN</label>
                  <input id="ba-number" type="text" placeholder="Enter number" />
                </div>
                <div className="ba-field">
                  <label htmlFor="ba-swift">SWIFT / BIC</label>
                  <input id="ba-swift" type="text" placeholder="8 or 11 characters" />
                </div>
                <div className="ba-field">
                  <label htmlFor="ba-currency">Currency</label>
                  <select id="ba-currency">
                    <option>USD</option>
                    <option>EUR</option>
                    <option>GBP</option>
                    <option>NPR</option>
                  </select>
                </div>
                <div className="ba-field">
                  <label htmlFor="ba-type">Account type</label>
                  <select id="ba-type">
                    <option>Savings</option>
                    <option>Current</option>
                    <option>Business</option>
                  </select>
                </div>
              </div>

              <p className="ba-form-note">
                <Info size={12} /> The account holder name must match your
                verified identity exactly, or the account will be rejected.
              </p>

              <button type="button" className="ba-btn ba-btn--primary">
                Submit for verification
              </button>
            </div>
          )}

          {/* ------------------------- ACCOUNTS ---------------------- */}
          <div className="ba-card">
            <h2 className="ba-card-title">
              <Building2 size={14} /> Linked Accounts
            </h2>

            {accounts.length === 0 ? (
              <div className="ba-empty">
                <Landmark size={20} />
                <p>
                  No bank accounts linked yet. Add one to withdraw in fiat.
                </p>
              </div>
            ) : (
              <ul className="ba-list">
                {accounts.map((account) => {
                  const meta = STATUS_META[account.status];
                  const StatusIcon = meta.icon;
                  const isDefault = account.id === defaultId;
                  const usable = isUsable(account);

                  return (
                    <li
                      key={account.id}
                      className={`ba-item is-${meta.tone} ${isDefault ? "is-default" : ""}`}
                    >
                      <div className="ba-item-main">
                        <span className="ba-bank-icon">
                          <Landmark size={16} />
                        </span>

                        <div className="ba-item-body">
                          <div className="ba-item-top">
                            <b>{account.bank}</b>
                            {isDefault && (
                              <span className="ba-default-tag">
                                <Star size={10} /> Default
                              </span>
                            )}
                            <span className={`ba-status is-${meta.tone}`}>
                              <StatusIcon size={11} />
                              {account.status}
                            </span>
                          </div>

                          <span className="ba-number">{account.number}</span>

                          <dl className="ba-meta">
                            <div>
                              <dt>Holder</dt>
                              <dd>{account.holder}</dd>
                            </div>
                            <div>
                              <dt>Type</dt>
                              <dd>{account.type}</dd>
                            </div>
                            <div>
                              <dt>Currency</dt>
                              <dd>{account.currency}</dd>
                            </div>
                            <div>
                              <dt>SWIFT</dt>
                              <dd>{account.swift}</dd>
                            </div>
                            <div>
                              <dt>Country</dt>
                              <dd>{account.country}</dd>
                            </div>
                            <div>
                              <dt>Added</dt>
                              <dd>{account.added}</dd>
                            </div>
                          </dl>

                          {account.status === "Rejected" && (
                            <p className="ba-item-alert">
                              <AlertTriangle size={12} />
                              Name did not match your verified identity.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="ba-item-actions">
                        {/* Offered only where it can actually be honoured -
                            an unverified account cannot receive a payout */}
                        {usable && !isDefault && (
                          <button
                            type="button"
                            className="ba-mini-btn"
                            onClick={() => setDefault(account.id)}
                          >
                            <Star size={12} /> Set default
                          </button>
                        )}

                        {confirming === account.id ? (
                          <span className="ba-confirm">
                            <span>Remove?</span>
                            <button
                              type="button"
                              className="ba-mini-btn is-danger"
                              onClick={() => removeAccount(account.id)}
                            >
                              Yes, remove
                            </button>
                            <button
                              type="button"
                              className="ba-mini-btn"
                              onClick={() => setConfirming(null)}
                            >
                              Keep
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="ba-mini-btn is-danger"
                            onClick={() => setConfirming(account.id)}
                            aria-label={`Remove ${account.bank}`}
                          >
                            <Trash2 size={12} /> Remove
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* -------------------------- SIDE RAIL ----------------------- */}
        <aside className="ba-side">
          <div className="ba-card">
            <h2 className="ba-card-title">
              <Star size={14} /> Default Account
            </h2>

            {defaultAccount ? (
              <>
                <div className="ba-default-head">
                  <span className="ba-bank-icon">
                    <Landmark size={16} />
                  </span>
                  <span className="ba-default-text">
                    <b>{defaultAccount.bank}</b>
                    <small>{defaultAccount.number}</small>
                  </span>
                </div>

                <dl className="ba-summary">
                  <div>
                    <dt>Currency</dt>
                    <dd>{defaultAccount.currency}</dd>
                  </div>
                  <div>
                    <dt>Type</dt>
                    <dd>{defaultAccount.type}</dd>
                  </div>
                  <div>
                    <dt>Country</dt>
                    <dd>{defaultAccount.country}</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd className="ba-up">{defaultAccount.status}</dd>
                  </div>
                </dl>

                <p className="ba-note">
                  Fiat withdrawals are sent here unless you pick another
                  account at the time.
                </p>
              </>
            ) : (
              <p className="ba-muted">
                No default set. Verify an account to enable fiat withdrawals.
              </p>
            )}
          </div>

          <div className="ba-card">
            <h2 className="ba-card-title">
              <Globe size={14} /> Withdrawal Info
            </h2>

            <dl className="ba-summary">
              {WITHDRAWAL_INFO.map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="ba-card">
            <h2 className="ba-card-title">
              <ShieldCheck size={14} /> Before You Link
            </h2>

            <ul className="ba-checklist">
              <li>
                <CheckCircle2 size={13} />
                The account must be in your own name.
              </li>
              <li>
                <CheckCircle2 size={13} />
                Third-party accounts are rejected automatically.
              </li>
              <li>
                <CheckCircle2 size={13} />
                Verification usually completes in 1–2 business days.
              </li>
              <li>
                <CheckCircle2 size={13} />
                Only verified accounts can be set as default.
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default BankAccount;
