import { useEffect, useRef, useState } from "react";
import "./Topbar.css";

const DATE_RANGES = [
  "Jul 13 - Jul 19, 2025",
  "Jul 06 - Jul 12, 2025",
  "Last 30 Days",
  "This Month",
];

/**
 * A native <select> cannot be themed: the option list is drawn by the OS, so
 * the row padding, panel corners and the blue highlight on the hovered row are
 * all outside CSS's reach. This is a button plus a listbox, which is fully
 * ours to style.
 */
const DateRangePicker = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const optionRefs = useRef([]);

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Move focus into the list so the keyboard lands on the current value
  useEffect(() => {
    if (!open) return;
    const index = Math.max(DATE_RANGES.indexOf(value), 0);
    optionRefs.current[index]?.focus();
  }, [open, value]);

  const moveFocus = (from, step) => {
    const next = (from + step + DATE_RANGES.length) % DATE_RANGES.length;
    optionRefs.current[next]?.focus();
  };

  const onOptionKeyDown = (e, index) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveFocus(index, 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveFocus(index, -1);
    }
  };

  const select = (range) => {
    onChange(range);
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div className={`date-picker ${open ? "is-open" : ""}`} ref={rootRef}>
      <button
        type="button"
        ref={triggerRef}
        className="date-trigger"
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <svg
          className="picker-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>

        <span className="date-value">{value}</span>

        <svg
          className="chevron-icon"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <ul className="date-menu" role="listbox">
          {DATE_RANGES.map((range, index) => (
            <li key={range} role="option" aria-selected={range === value}>
              <button
                type="button"
                ref={(el) => (optionRefs.current[index] = el)}
                className={`date-option ${range === value ? "is-active" : ""}`}
                onClick={() => select(range)}
                onKeyDown={(e) => onOptionKeyDown(e, index)}
              >
                <span>{range}</span>
                {range === value && (
                  <svg
                    className="date-check"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const Topbar = ({ userName = "Dhirendra Bam" }) => {
  const [selectedDate, setSelectedDate] = useState(DATE_RANGES[0]);

  return (
    <div className="topbar d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 py-2 mb-2">
      {/* Left: greeting */}
      <div className="topbar-greeting">
        <h4 className="mb-0 topbar-username d-flex align-items-center gap-2">
          Welcome back, {userName}
          <span className="wave-emoji" role="img" aria-label="wave">
            👋
          </span>
        </h4>
        <p className="mb-0 topbar-subtitle">
          Here&apos;s what&apos;s happening with your portfolio today.
        </p>
      </div>

      {/* Right: actions (Date Range Dropdown & Export Report) */}
      <div className="topbar-actions d-flex align-items-center gap-2 gap-md-3 flex-wrap">
        {/* Date Range Selector Dropdown */}
        <DateRangePicker value={selectedDate} onChange={setSelectedDate} />

        {/* Export Report Button */}
        <button type="button" className="btn-topbar btn-export">
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
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>Export Report</span>
        </button>
      </div>
    </div>
  );
};

export default Topbar;
