import "./Topbar.css";

const Topbar = ({ userName = "Dhirendra Bam" }) => {
  return (
    <div className="topbar d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 py-2 mb-2">
      {/* Left: greeting */}
      <div className="topbar-greeting">
        <p className="mb-0 topbar-welcome">Welcome back,</p>
        <h4 className="mb-0 topbar-username d-flex align-items-center gap-2">
          {userName}
          <span className="wave-emoji" role="img" aria-label="wave">
            👋
          </span>
        </h4>
        <p className="mb-0 topbar-subtitle">
          Here&apos;s what&apos;s happening with your portfolio today.
        </p>
      </div>

      {/* Right: actions */}
      <div className="topbar-actions d-flex align-items-center gap-2 gap-md-3 flex-wrap">
        <button type="button" className="btn-topbar btn-deposit">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
          <span>Deposit</span>
        </button>

        <button type="button" className="btn-topbar btn-withdraw">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
          <span>Withdraw</span>
        </button>

        <button type="button" className="btn-topbar btn-trade">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 3" />
          </svg>
          <span>Trade Now</span>
        </button>
      </div>
    </div>
  );
};

export default Topbar;
