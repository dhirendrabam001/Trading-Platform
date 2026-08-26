import { useMemo, useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Smartphone,
  Key,
  Fingerprint,
  Monitor,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Mail,
  ListChecks,
  Snowflake,
} from "lucide-react";
import "./Security.css";

/* ================================================================== data ===
   Each measure carries its own weight. The security score is DERIVED by
   summing the weights that are switched on - never stored - so the number at
   the top cannot drift away from the toggles below it, which is exactly how
   a security score ends up lying to the person reading it. */

const MEASURES = [
  {
    id: "password",
    icon: Lock,
    title: "Strong Password",
    copy: "At least 12 characters, changed in the last 90 days.",
    weight: 20,
    enabled: true,
    detail: "Last changed 02 Jul 2025",
    action: "Change password",
  },
  {
    id: "totp",
    icon: Smartphone,
    title: "Authenticator App (2FA)",
    copy: "Time-based codes from an app on your phone.",
    weight: 25,
    enabled: true,
    detail: "Google Authenticator · added 18 Jul 2025",
    action: "Reconfigure",
  },
  {
    id: "antiphishing",
    icon: Mail,
    title: "Anti-phishing Code",
    copy: "A phrase we include in every genuine email to you.",
    weight: 15,
    enabled: true,
    detail: "Set to “NEPAL-4821”",
    action: "Change code",
  },
  {
    id: "whitelist",
    icon: ListChecks,
    title: "Withdrawal Whitelist",
    copy: "Funds can only leave to addresses you have approved.",
    weight: 20,
    enabled: false,
    detail: "Not enabled — withdrawals may go anywhere",
    action: "Enable whitelist",
  },
  {
    id: "biometric",
    icon: Fingerprint,
    title: "Biometric Login",
    copy: "Face or fingerprint unlock on trusted devices.",
    weight: 10,
    enabled: false,
    detail: "Not set up on this device",
    action: "Set up",
  },
  {
    id: "alerts",
    icon: AlertTriangle,
    title: "Login Alerts",
    copy: "Email whenever your account is accessed from a new device.",
    weight: 10,
    enabled: true,
    detail: "Sent to dhirendra@gmail.com",
    action: "Manage",
  },
];

const SESSIONS = [
  { id: "s1", device: "Chrome on Windows", location: "Kathmandu, Nepal", ip: "192.168.1.100", last: "Active now",   current: true },
  { id: "s2", device: "Safari on iPhone",  location: "Kathmandu, Nepal", ip: "192.168.1.101", last: "2 hours ago",  current: false },
  { id: "s3", device: "Chrome on macOS",   location: "Lalitpur, Nepal",  ip: "192.168.1.102", last: "Yesterday",    current: false },
  { id: "s4", device: "Firefox on Ubuntu", location: "Pokhara, Nepal",   ip: "10.14.22.8",    last: "3 days ago",   current: false },
];

const ACTIVITY = [
  { id: "a1", type: "ok",    title: "Signed in",              detail: "Chrome on Windows · Kathmandu", time: "Today, 09:12" },
  { id: "a2", type: "ok",    title: "2FA verified",           detail: "Authenticator app",             time: "Today, 09:12" },
  { id: "a3", type: "warn",  title: "Failed sign-in attempt", detail: "Unknown device · Singapore",    time: "Yesterday, 23:41" },
  { id: "a4", type: "ok",    title: "Withdrawal approved",    detail: "0.15 BTC · confirmed by 2FA",   time: "Yesterday, 18:22" },
  { id: "a5", type: "ok",    title: "Password changed",       detail: "From a trusted device",         time: "02 Jul, 14:08" },
];

const TOTAL_WEIGHT = MEASURES.reduce((sum, m) => sum + m.weight, 0);

/* Bands the score is described in. Kept as data so the label, the colour and
   the ring all read from one place. */
const BANDS = [
  { min: 85, label: "Strong", tone: "up" },
  { min: 60, label: "Good", tone: "warn" },
  { min: 0, label: "At Risk", tone: "down" },
];

const bandFor = (score) => BANDS.find((b) => score >= b.min);

/* ============================================================= component ===*/

const Security = () => {
  const [measures, setMeasures] = useState(MEASURES);
  const [sessions, setSessions] = useState(SESSIONS);

  const toggle = (id) =>
    setMeasures((list) =>
      list.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m)),
    );

  /* Sum of enabled weights, as a percentage of everything available. Because
     TOTAL_WEIGHT comes from the same list, adding a measure re-bases the
     score automatically rather than leaving a stale denominator. */
  const score = useMemo(() => {
    const earned = measures
      .filter((m) => m.enabled)
      .reduce((sum, m) => sum + m.weight, 0);
    return Math.round((earned / TOTAL_WEIGHT) * 100);
  }, [measures]);

  const band = bandFor(score);

  /* Recommendations are exactly the measures that are off, heaviest first -
     never a separate hand-written list that could disagree with the toggles */
  const recommendations = useMemo(
    () =>
      measures
        .filter((m) => !m.enabled)
        .sort((a, b) => b.weight - a.weight),
    [measures],
  );

  /* The current session cannot be revoked from itself - signing out of the
     device you are using is what "Sign out everywhere" is for */
  const revoke = (id) =>
    setSessions((list) => list.filter((s) => s.id !== id || s.current));

  const signOutOthers = () =>
    setSessions((list) => list.filter((s) => s.current));

  const enabledCount = measures.filter((m) => m.enabled).length;

  const metrics = [
    {
      key: "score",
      icon: band.tone === "up" ? ShieldCheck : ShieldAlert,
      label: "Security Score",
      value: `${score}`,
      sub: band.label,
      tone: band.tone,
    },
    {
      key: "measures",
      icon: CheckCircle2,
      label: "Protections On",
      value: `${enabledCount}/${measures.length}`,
      sub:
        recommendations.length > 0
          ? `${recommendations.length} still available`
          : "Everything enabled",
      tone: recommendations.length === 0 ? "up" : "neutral",
    },
    {
      key: "sessions",
      icon: Monitor,
      label: "Active Sessions",
      value: String(sessions.length),
      sub: `${sessions.filter((s) => !s.current).length} besides this device`,
      tone: "neutral",
    },
    {
      key: "password",
      icon: Key,
      label: "Password Age",
      value: "41 days",
      sub: "Changed 02 Jul 2025",
      tone: "neutral",
    },
  ];

  return (
    <section className="sc-page">
      {/* ============================ HEADER =========================== */}
      <header className="sc-header">
        <div className="sc-heading">
          <span className="sc-heading-icon">
            <ShieldCheck size={19} />
          </span>
          <div>
            <h1 className="sc-title">Security</h1>
            <p className="sc-subtitle">
              Protections on your account, the devices signed in, and what
              happened recently.
            </p>
          </div>
        </div>

        <span className={`sc-badge is-${band.tone}`}>
          {band.tone === "up" ? (
            <ShieldCheck size={13} />
          ) : (
            <ShieldAlert size={13} />
          )}
          {band.label} · {score}/100
        </span>
      </header>

      {/* ============================ METRICS ========================== */}
      <div className="sc-metrics">
        {metrics.map(({ key, icon: Icon, label, value, sub, tone }) => (
          <div className={`sc-card sc-metric is-${tone}`} key={key}>
            <span className="sc-metric-icon">
              <Icon size={16} />
            </span>
            <div className="sc-metric-body">
              <span className="sc-metric-label">{label}</span>
              <strong className="sc-metric-value">{value}</strong>
              <span className="sc-metric-sub">{sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ============================= GRID ============================ */}
      <div className="sc-grid">
        <div className="sc-col-main">
          {/* -------------------------- MEASURES ---------------------- */}
          <div className="sc-card">
            <div className="sc-card-head">
              <h2 className="sc-card-title">
                <ShieldCheck size={14} /> Protections
              </h2>
              <span className="sc-muted">
                {enabledCount} of {measures.length} enabled
              </span>
            </div>

            <ul className="sc-measures">
              {measures.map((m) => {
                const Icon = m.icon;

                return (
                  <li
                    key={m.id}
                    className={`sc-measure ${m.enabled ? "is-on" : "is-off"}`}
                  >
                    <span className="sc-measure-icon">
                      <Icon size={16} />
                    </span>

                    <div className="sc-measure-body">
                      <div className="sc-measure-top">
                        <b>{m.title}</b>
                        <span className="sc-weight">+{m.weight}</span>
                        <span
                          className={`sc-status ${m.enabled ? "is-on" : "is-off"}`}
                        >
                          {m.enabled ? (
                            <CheckCircle2 size={11} />
                          ) : (
                            <XCircle size={11} />
                          )}
                          {m.enabled ? "On" : "Off"}
                        </span>
                      </div>
                      <p>{m.copy}</p>
                      <small className={m.enabled ? "" : "sc-warn"}>
                        {m.detail}
                      </small>
                    </div>

                    <div className="sc-measure-actions">
                      <button type="button" className="sc-mini-btn">
                        {m.action}
                      </button>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={m.enabled}
                        aria-label={`${m.title} — ${m.enabled ? "on" : "off"}`}
                        className={`sc-switch ${m.enabled ? "is-on" : ""}`}
                        onClick={() => toggle(m.id)}
                      >
                        <i />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* -------------------------- SESSIONS ---------------------- */}
          <div className="sc-card">
            <div className="sc-card-head">
              <h2 className="sc-card-title">
                <Monitor size={14} /> Active Sessions
              </h2>
              <button
                type="button"
                className="sc-mini-btn is-danger"
                onClick={signOutOthers}
                disabled={sessions.filter((s) => !s.current).length === 0}
              >
                <LogOut size={12} /> Sign out everywhere else
              </button>
            </div>

            <div className="sc-table-scroll">
              <table className="sc-table">
                <thead>
                  <tr>
                    <th>Device</th>
                    <th>Location</th>
                    <th>IP Address</th>
                    <th>Last Active</th>
                    <th aria-label="Action" />
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.id} className={s.current ? "is-current" : ""}>
                      <td data-label="Device" className="sc-cell-device">
                        <span className="sc-device-icon">
                          <Monitor size={14} />
                        </span>
                        <span className="sc-device-text">
                          <b>{s.device}</b>
                          {s.current && (
                            <span className="sc-current-tag">This device</span>
                          )}
                        </span>
                      </td>
                      <td data-label="Location">
                        <span className="sc-loc">
                          <MapPin size={11} />
                          {s.location}
                        </span>
                      </td>
                      <td data-label="IP Address" className="sc-muted">
                        {s.ip}
                      </td>
                      <td data-label="Last Active">
                        <span className={s.current ? "sc-up" : "sc-muted"}>
                          {s.last}
                        </span>
                      </td>
                      <td data-label="Action" className="sc-cell-action">
                        {/* The current session has no revoke button: signing
                            out of the device you are on is what the header
                            action is for */}
                        {!s.current && (
                          <button
                            type="button"
                            className="sc-mini-btn is-danger"
                            onClick={() => revoke(s.id)}
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* -------------------------- ACTIVITY ---------------------- */}
          <div className="sc-card">
            <h2 className="sc-card-title">
              <Clock size={14} /> Recent Security Activity
            </h2>

            <ul className="sc-activity">
              {ACTIVITY.map((a) => (
                <li key={a.id} className={`sc-event is-${a.type}`}>
                  <span className="sc-event-icon">
                    {a.type === "ok" ? (
                      <CheckCircle2 size={13} />
                    ) : (
                      <AlertTriangle size={13} />
                    )}
                  </span>
                  <span className="sc-event-body">
                    <b>{a.title}</b>
                    <small>{a.detail}</small>
                  </span>
                  <span className="sc-event-time">{a.time}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* -------------------------- SIDE RAIL ----------------------- */}
        <aside className="sc-side">
          <div className="sc-card">
            <h2 className="sc-card-title">Security Score</h2>

            {/* Ring drawn with a conic gradient: one value, no extra markup,
                and it re-themes with the tokens */}
            <div className="sc-score">
              <div
                className={`sc-ring is-${band.tone}`}
                style={{ "--pct": `${score}%` }}
              >
                <div className="sc-ring-inner">
                  <strong>{score}</strong>
                  <span>/ 100</span>
                </div>
              </div>

              <div className="sc-score-text">
                <b className={`sc-${band.tone}`}>{band.label}</b>
                <small>
                  {recommendations.length === 0
                    ? "Every protection is enabled."
                    : `${recommendations.length} protection${recommendations.length === 1 ? "" : "s"} still available.`}
                </small>
              </div>
            </div>

            <ul className="sc-breakdown">
              {measures.map((m) => (
                <li key={m.id} className={m.enabled ? "is-on" : "is-off"}>
                  <span className="sc-bd-dot" />
                  <span className="sc-bd-label">{m.title}</span>
                  <b>
                    {m.enabled ? "+" : ""}
                    {m.enabled ? m.weight : 0}
                  </b>
                </li>
              ))}
            </ul>
          </div>

          {recommendations.length > 0 && (
            <div className="sc-card sc-reco">
              <h2 className="sc-card-title">
                <ShieldAlert size={14} /> Recommended
              </h2>

              <p className="sc-note-lead">
                Turning these on would take your score to 100.
              </p>

              <ul className="sc-reco-list">
                {recommendations.map((m) => (
                  <li key={m.id}>
                    <span className="sc-reco-body">
                      <b>{m.title}</b>
                      <small>{m.copy}</small>
                    </span>
                    <span className="sc-reco-gain">+{m.weight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="sc-card">
            <h2 className="sc-card-title">
              <Snowflake size={14} /> Emergency
            </h2>

            <p className="sc-note-lead">
              If you think your account is compromised, freeze it. Trading and
              withdrawals stop immediately.
            </p>

            <button type="button" className="sc-btn sc-btn--danger">
              <Snowflake size={14} /> Freeze account
            </button>

            <p className="sc-note">
              Freezing is reversible, but you will need to pass identity
              verification to lift it.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default Security;
