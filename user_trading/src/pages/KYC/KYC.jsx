import { useMemo, useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Lock,
  Upload,
  FileText,
  User,
  Mail,
  Phone,
  MapPin,
  ScanFace,
  ArrowRight,
  AlertTriangle,
  Award,
} from "lucide-react";
import "./KYC.css";

/* ================================================================== data ===
   Only each step's own status is stored. Whether a step is REACHABLE is
   derived from the steps before it, so the page can never show step 5 as
   available while step 3 is still outstanding - the classic way a
   verification flow ends up letting people skip ahead. */

const STEPS = [
  {
    id: "email",
    icon: Mail,
    title: "Email Address",
    copy: "Confirm the address on your account.",
    status: "Verified",
    detail: "dhirendra@gmail.com",
    level: 1,
  },
  {
    id: "phone",
    icon: Phone,
    title: "Phone Number",
    copy: "Receive a code by SMS to confirm your number.",
    status: "Verified",
    detail: "+977 •••• ••42",
    level: 1,
  },
  {
    id: "personal",
    icon: User,
    title: "Personal Information",
    copy: "Legal name, date of birth and nationality.",
    status: "Verified",
    detail: "Submitted 08 Aug 2025",
    level: 1,
  },
  {
    id: "identity",
    icon: FileText,
    title: "Identity Document",
    copy: "Passport, national ID or driving licence.",
    status: "In Review",
    detail: "Passport uploaded 12 Aug 2025",
    level: 2,
  },
  {
    id: "address",
    icon: MapPin,
    title: "Proof of Address",
    copy: "Utility bill or bank statement from the last 3 months.",
    status: "Action Needed",
    detail: "Rejected — document older than 3 months",
    level: 2,
  },
  {
    id: "face",
    icon: ScanFace,
    title: "Face Verification",
    copy: "A short liveness check to match you to your document.",
    status: "Not Started",
    detail: "Takes about 2 minutes",
    level: 3,
  },
];

const LEVELS = [
  {
    level: 1,
    name: "Basic",
    copy: "Deposit and trade with modest limits.",
    withdrawal: "$2,000 / day",
    trading: "$10,000 / day",
  },
  {
    level: 2,
    name: "Intermediate",
    copy: "Higher limits and fiat withdrawals.",
    withdrawal: "$50,000 / day",
    trading: "$250,000 / day",
  },
  {
    level: 3,
    name: "Advanced",
    copy: "Institutional limits and OTC access.",
    withdrawal: "Unlimited",
    trading: "Unlimited",
  },
];

/* A step counts as finished only when it is Verified. "In Review" is not
   done - the account cannot rely on it yet - and this single definition is
   what the progress bar, the level badge and the gating all read. */
const isComplete = (step) => step.status === "Verified";

/* ============================================================== derived ===*/

const derive = (steps) =>
  steps.map((step, index) => {
    /* Reachable only once every earlier step is complete. Derived rather
       than stored, so adding or reordering a step cannot leave a stale
       "locked" flag behind. */
    const priorDone = steps.slice(0, index).every(isComplete);
    const locked = !priorDone && !isComplete(step);

    return {
      ...step,
      locked,
      complete: isComplete(step),
      /* What the button should offer, given where the step actually is.
         `locked` is tested FIRST, before any status: a locked step that also
         reads "Action Needed" must not hand out a working Re-upload button,
         which is exactly the gap that lets someone skip ahead in the flow. */
      action:
        isComplete(step) || locked
          ? null
          : step.status === "In Review"
            ? "View submission"
            : step.status === "Action Needed"
              ? "Re-upload document"
              : "Start verification",
    };
  });

const ROWS = derive(STEPS);

const COMPLETED = ROWS.filter((s) => s.complete).length;
const PROGRESS = (COMPLETED / ROWS.length) * 100;

/* The account sits at the highest level whose steps are ALL verified. A
   half-finished level does not count, which is why this walks upward and
   stops at the first gap rather than taking the max level seen. */
const CURRENT_LEVEL = (() => {
  let reached = 0;
  for (const { level } of LEVELS) {
    const stepsForLevel = ROWS.filter((s) => s.level === level);
    if (stepsForLevel.length > 0 && stepsForLevel.every((s) => s.complete)) {
      reached = level;
    } else {
      break;
    }
  }
  return reached;
})();

const NEXT_LEVEL = LEVELS.find((l) => l.level === CURRENT_LEVEL + 1) || null;
const ACTIVE = ROWS.find((s) => !s.complete && !s.locked) || null;

const STATUS_META = {
  Verified: { icon: CheckCircle2, tone: "done" },
  "In Review": { icon: Clock, tone: "review" },
  "Action Needed": { icon: AlertTriangle, tone: "warn" },
  "Not Started": { icon: Upload, tone: "idle" },
};

/* ============================================================= component ===*/

const KYC = () => {
  const [openStep, setOpenStep] = useState(ACTIVE ? ACTIVE.id : null);

  const currentLevelMeta = useMemo(
    () => LEVELS.find((l) => l.level === CURRENT_LEVEL) || null,
    [],
  );

  return (
    <section className="kyc-page">
      {/* ============================ HEADER =========================== */}
      <header className="kyc-header">
        <div className="kyc-heading">
          <span className="kyc-heading-icon">
            <ShieldCheck size={19} />
          </span>
          <div>
            <h1 className="kyc-title">KYC Verification</h1>
            <p className="kyc-subtitle">
              Verify your identity to raise your limits and unlock fiat
              withdrawals.
            </p>
          </div>
        </div>

        <span
          className={`kyc-badge ${CURRENT_LEVEL > 0 ? "is-done" : "is-idle"}`}
        >
          <ShieldCheck size={13} />
          {currentLevelMeta
            ? `Level ${CURRENT_LEVEL} · ${currentLevelMeta.name}`
            : "Unverified"}
        </span>
      </header>

      {/* =========================== PROGRESS ========================== */}
      <div className="kyc-card kyc-progress-card">
        <div className="kyc-progress-head">
          <div>
            <h2 className="kyc-card-title">Verification Progress</h2>
            <p className="kyc-note-inline">
              {COMPLETED} of {ROWS.length} steps complete
              {ACTIVE ? ` — next up: ${ACTIVE.title}` : ""}
            </p>
          </div>
          <strong className="kyc-progress-pct">{PROGRESS.toFixed(0)}%</strong>
        </div>

        <span className="kyc-progress-track">
          <i style={{ width: `${Math.max(2, PROGRESS)}%` }} />
        </span>

        {/* Level tiers, with the one the account has actually reached marked
            and the rest shown as what they would unlock */}
        <div className="kyc-tiers">
          {LEVELS.map((tier) => {
            const reached = tier.level <= CURRENT_LEVEL;
            const isNext = NEXT_LEVEL && tier.level === NEXT_LEVEL.level;

            return (
              <div
                key={tier.level}
                className={`kyc-tier ${reached ? "is-reached" : ""} ${isNext ? "is-next" : ""}`}
              >
                <span className="kyc-tier-top">
                  <span className="kyc-tier-mark">
                    {reached ? (
                      <CheckCircle2 size={14} />
                    ) : isNext ? (
                      <ArrowRight size={14} />
                    ) : (
                      <Lock size={13} />
                    )}
                  </span>
                  <b>
                    Level {tier.level} · {tier.name}
                  </b>
                </span>
                <p>{tier.copy}</p>
                <dl className="kyc-tier-limits">
                  <div>
                    <dt>Withdrawal</dt>
                    <dd>{tier.withdrawal}</dd>
                  </div>
                  <div>
                    <dt>Trading</dt>
                    <dd>{tier.trading}</dd>
                  </div>
                </dl>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================= GRID ============================ */}
      <div className="kyc-grid">
        {/* ---------------------------- STEPS ------------------------- */}
        <div className="kyc-card">
          <h2 className="kyc-card-title">Verification Steps</h2>

          <ol className="kyc-steps">
            {ROWS.map((step, index) => {
              const meta = STATUS_META[step.status];
              const StepIcon = step.icon;
              const StatusIcon = meta.icon;
              const open = openStep === step.id;

              return (
                <li
                  key={step.id}
                  className={`kyc-step is-${meta.tone} ${step.locked ? "is-locked" : ""} ${open ? "is-open" : ""}`}
                >
                  <button
                    type="button"
                    className="kyc-step-head"
                    aria-expanded={open}
                    onClick={() => setOpenStep(open ? null : step.id)}
                  >
                    <span className="kyc-step-num">
                      {step.complete ? <CheckCircle2 size={14} /> : index + 1}
                    </span>

                    <span className="kyc-step-icon">
                      {step.locked ? <Lock size={15} /> : <StepIcon size={15} />}
                    </span>

                    <span className="kyc-step-body">
                      <b>{step.title}</b>
                      <small>{step.copy}</small>
                    </span>

                    <span className={`kyc-status is-${meta.tone}`}>
                      <StatusIcon size={11} />
                      {step.locked ? "Locked" : step.status}
                    </span>
                  </button>

                  {open && (
                    <div className="kyc-step-detail">
                      <p className="kyc-step-note">
                        {step.locked
                          ? "Complete the steps above to unlock this one."
                          : step.detail}
                      </p>

                      {/* An upload zone only where one is actually useful:
                          locked steps cannot accept a file, and verified ones
                          have nothing left to submit. */}
                      {!step.locked &&
                        !step.complete &&
                        step.status !== "In Review" && (
                          <div className="kyc-drop">
                            <Upload size={18} />
                            <b>Drag a file here, or browse</b>
                            <small>JPG, PNG or PDF · up to 10 MB</small>
                          </div>
                        )}

                      {step.action && (
                        <button
                          type="button"
                          className={`kyc-btn ${step.status === "Action Needed" ? "kyc-btn--warn" : "kyc-btn--primary"}`}
                        >
                          {step.action}
                          <ArrowRight size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        {/* -------------------------- SIDE RAIL ----------------------- */}
        <aside className="kyc-side">
          <div className="kyc-card">
            <h2 className="kyc-card-title">
              <Award size={14} /> Your Limits
            </h2>

            {currentLevelMeta ? (
              <>
                <div className="kyc-level-head">
                  <span className="kyc-level-mark">{CURRENT_LEVEL}</span>
                  <span className="kyc-level-text">
                    <b>{currentLevelMeta.name}</b>
                    <small>Current level</small>
                  </span>
                </div>

                <dl className="kyc-summary">
                  <div>
                    <dt>Daily withdrawal</dt>
                    <dd>{currentLevelMeta.withdrawal}</dd>
                  </div>
                  <div>
                    <dt>Daily trading</dt>
                    <dd>{currentLevelMeta.trading}</dd>
                  </div>
                  <div>
                    <dt>Fiat withdrawals</dt>
                    <dd className={CURRENT_LEVEL >= 2 ? "kyc-up" : "kyc-muted"}>
                      {CURRENT_LEVEL >= 2 ? "Enabled" : "Locked"}
                    </dd>
                  </div>
                  <div>
                    <dt>OTC desk</dt>
                    <dd className={CURRENT_LEVEL >= 3 ? "kyc-up" : "kyc-muted"}>
                      {CURRENT_LEVEL >= 3 ? "Enabled" : "Locked"}
                    </dd>
                  </div>
                </dl>
              </>
            ) : (
              <p className="kyc-muted">
                Complete Level 1 to start trading with limits.
              </p>
            )}
          </div>

          {NEXT_LEVEL && (
            <div className="kyc-card kyc-next">
              <h2 className="kyc-card-title">
                <ArrowRight size={14} /> Unlock Level {NEXT_LEVEL.level}
              </h2>

              <p className="kyc-next-copy">{NEXT_LEVEL.copy}</p>

              <ul className="kyc-unlock-list">
                {ROWS.filter(
                  (s) => s.level === NEXT_LEVEL.level && !s.complete,
                ).map((s) => (
                  <li key={s.id}>
                    <span className={`kyc-dot is-${STATUS_META[s.status].tone}`} />
                    <span className="kyc-unlock-body">
                      <b>{s.title}</b>
                      <small>{s.locked ? "Locked" : s.status}</small>
                    </span>
                  </li>
                ))}
              </ul>

              <dl className="kyc-summary">
                <div>
                  <dt>New withdrawal limit</dt>
                  <dd className="kyc-up">{NEXT_LEVEL.withdrawal}</dd>
                </div>
                <div>
                  <dt>New trading limit</dt>
                  <dd className="kyc-up">{NEXT_LEVEL.trading}</dd>
                </div>
              </dl>
            </div>
          )}

          <div className="kyc-card">
            <h2 className="kyc-card-title">
              <ShieldCheck size={14} /> Good to Know
            </h2>

            <ul className="kyc-checklist">
              <li>
                <CheckCircle2 size={13} />
                Documents are reviewed within 24–48 hours.
              </li>
              <li>
                <CheckCircle2 size={13} />
                Make sure all four corners are visible and readable.
              </li>
              <li>
                <CheckCircle2 size={13} />
                Your name must match your account exactly.
              </li>
              <li>
                <CheckCircle2 size={13} />
                Documents are encrypted and never shared.
              </li>
            </ul>

            <p className="kyc-note">
              Having trouble? Contact support and quote your account email.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default KYC;
