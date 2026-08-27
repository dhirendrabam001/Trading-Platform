import { useMemo, useState } from "react";
import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
} from "../../redux/api/tradingApi";
import {
  Bell,
  BellOff,
  CheckCheck,
  Trash2,
  TrendingUp,
  ShieldCheck,
  Wallet,
  Megaphone,
  AlertTriangle,
  Settings,
  Moon,
  Check,
} from "lucide-react";
import "./Notifications.css";

/* ================================================================== data ===
   Only each notification's own facts are stored, `read` included. Every count
   on the page - the unread badge, the per-tab totals, the metrics - is
   DERIVED from that flag, so the badge can never claim a number the list does
   not actually contain.

   Exactly five start unread, matching the badge in the sidebar. */

const CATEGORIES = {
  Trade: { icon: TrendingUp, label: "Trades", rgb: "0, 194, 129" },
  Security: { icon: ShieldCheck, label: "Security", rgb: "232, 65, 66" },
  Wallet: { icon: Wallet, label: "Wallet", rgb: "59, 130, 246" },
  Alert: { icon: AlertTriangle, label: "Price Alerts", rgb: "245, 158, 11" },
  System: { icon: Megaphone, label: "System", rgb: "139, 92, 246" },
};

/* Order matters: the list is grouped in this sequence, so a day with nothing
   in it is simply skipped rather than rendering an empty heading. */
const DAY_ORDER = ["Today", "Yesterday", "Earlier"];

const TABS = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "Trade", label: "Trades" },
  { id: "Security", label: "Security" },
  { id: "Alert", label: "Price Alerts" },
  { id: "Wallet", label: "Wallet" },
  { id: "System", label: "System" },
];

const CHANNELS = [
  { id: "trade", label: "Trade activity", copy: "Fills, partial fills and cancellations", email: true, push: true },
  { id: "alert", label: "Price alerts", copy: "When a watched pair crosses your band", email: false, push: true },
  { id: "wallet", label: "Deposits & withdrawals", copy: "Funds arriving or leaving", email: true, push: true },
  { id: "security", label: "Security", copy: "Sign-ins, 2FA and password changes", email: true, push: true },
  { id: "system", label: "Product & maintenance", copy: "Downtime and feature news", email: false, push: false },
];

/* ============================================================= component ===*/

const Notifications = () => {
  /* The list comes from the server. Every action below calls the API and
     RTK Query refetches, so the badge, the tabs and the metrics all update
     from one source instead of from local state that could drift. */
  const { data, isLoading } = useGetNotificationsQuery({ limit: 100 });
  const items = useMemo(() => data?.notifications ?? [], [data]);

  const [markReadOnServer] = useMarkNotificationReadMutation();
  const [markAllOnServer] = useMarkAllNotificationsReadMutation();
  const [dismissOnServer] = useDeleteNotificationMutation();
  const [tab, setTab] = useState("all");
  const [prefs, setPrefs] = useState(() =>
    Object.fromEntries(
      CHANNELS.map((c) => [c.id, { email: c.email, push: c.push }]),
    ),
  );

  /* Counts are computed from the list itself, never tracked alongside it -
     a separate counter is how a badge ends up disagreeing with its list. */
  /* Taken from the response rather than counted locally: the server knows
     about notifications beyond the page we asked for. */
  const unread = data?.unread ?? 0;

  const perCategory = useMemo(() => {
    const counts = new Map();
    for (const n of items) {
      if (!n.read) counts.set(n.category, (counts.get(n.category) || 0) + 1);
    }
    return counts;
  }, [items]);

  /* Each action is one call. The list refreshes itself afterwards, and so
     does the bell in the navbar — both read the same cached data. */
  const markRead = (id) => markReadOnServer(id);

  const markAllRead = () => markAllOnServer();

  const dismiss = (id) => dismissOnServer(id);

  const togglePref = (channel, kind) =>
    setPrefs((p) => ({
      ...p,
      [channel]: { ...p[channel], [kind]: !p[channel][kind] },
    }));

  const filtered = useMemo(() => {
    if (tab === "all") return items;
    if (tab === "unread") return items.filter((n) => !n.read);
    return items.filter((n) => n.category === tab);
  }, [items, tab]);

  /* Group into day buckets, dropping any that end up empty */
  const groups = useMemo(
    () =>
      DAY_ORDER.map((day) => ({
        day,
        rows: filtered.filter((n) => n.day === day),
      })).filter((g) => g.rows.length > 0),
    [filtered],
  );

  const metrics = [
    {
      key: "unread",
      icon: Bell,
      label: "Unread",
      value: String(unread),
      sub: unread > 0 ? "Needs your attention" : "You are all caught up",
      tone: unread > 0 ? "warn" : "up",
    },
    {
      key: "today",
      icon: Megaphone,
      label: "Today",
      value: String(items.filter((n) => n.day === "Today").length),
      sub: "Since midnight",
      tone: "neutral",
    },
    {
      key: "alerts",
      icon: AlertTriangle,
      label: "Price Alerts",
      value: String(items.filter((n) => n.category === "Alert").length),
      sub: `${perCategory.get("Alert") || 0} unread`,
      tone: "neutral",
    },
    {
      key: "total",
      icon: CheckCheck,
      label: "Total",
      value: String(items.length),
      sub: `${items.length - unread} read`,
      tone: "neutral",
    },
  ];


  if (isLoading) {
    return (
      <section className="nt-page">
        <div className="nt-loading">Loading notifications…</div>
      </section>
    );
  }

  return (
    <section className="nt-page">
      {/* ============================ HEADER =========================== */}
      <header className="nt-header">
        <div className="nt-heading">
          <span className="nt-heading-icon">
            <Bell size={19} />
            {unread > 0 && <i className="nt-heading-dot" aria-hidden="true" />}
          </span>
          <div>
            <h1 className="nt-title">Notifications</h1>
            <p className="nt-subtitle">
              Fills, price alerts, security events and account activity in one
              place.
            </p>
          </div>
        </div>

        <div className="nt-header-actions">
          <button
            type="button"
            className="nt-btn nt-btn--ghost"
            onClick={markAllRead}
            disabled={unread === 0}
          >
            <CheckCheck size={14} /> Mark all read
          </button>
          <button type="button" className="nt-btn nt-btn--ghost">
            <Settings size={14} /> Settings
          </button>
        </div>
      </header>

      {/* ============================ METRICS ========================== */}
      <div className="nt-metrics">
        {metrics.map(({ key, icon: Icon, label, value, sub, tone }) => (
          <div className={`nt-card nt-metric is-${tone}`} key={key}>
            <span className="nt-metric-icon">
              <Icon size={16} />
            </span>
            <div className="nt-metric-body">
              <span className="nt-metric-label">{label}</span>
              <strong className="nt-metric-value">{value}</strong>
              <span className="nt-metric-sub">{sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ============================= GRID ============================ */}
      <div className="nt-grid">
        {/* ---------------------------- FEED -------------------------- */}
        <div className="nt-card">
          <div className="nt-tabs" role="tablist" aria-label="Filter notifications">
            {TABS.map((t) => {
              /* Unread counts sit on the tab that owns them, so the badge and
                 the list it filters to can never disagree */
              const count =
                t.id === "unread"
                  ? unread
                  : t.id === "all"
                    ? 0
                    : perCategory.get(t.id) || 0;

              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  className={`nt-tab ${tab === t.id ? "is-active" : ""}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                  {count > 0 && <span className="nt-tab-count">{count}</span>}
                </button>
              );
            })}
          </div>

          {groups.length === 0 ? (
            <div className="nt-empty">
              <BellOff size={20} />
              <p>
                {tab === "unread"
                  ? "Nothing unread. You are all caught up."
                  : "No notifications in this category."}
              </p>
            </div>
          ) : (
            groups.map((group) => (
              <div className="nt-group" key={group.day}>
                <div className="nt-group-head">
                  <span>{group.day}</span>
                  <i />
                  <small>{group.rows.length}</small>
                </div>

                <ul className="nt-list">
                  {group.rows.map((n) => {
                    const meta = CATEGORIES[n.category];
                    const Icon = meta.icon;

                    return (
                      <li
                        key={n.id}
                        className={`nt-item ${n.read ? "" : "is-unread"}`}
                        style={{ "--cat-rgb": meta.rgb }}
                      >
                        <span className="nt-item-icon">
                          <Icon size={15} />
                        </span>

                        <div className="nt-item-body">
                          <div className="nt-item-top">
                            <b>{n.title}</b>
                            {!n.read && (
                              <i className="nt-dot" aria-label="Unread" />
                            )}
                            <span className="nt-cat">{meta.label}</span>
                            <span className="nt-time">{n.time}</span>
                          </div>
                          <p>{n.body}</p>
                        </div>

                        <div className="nt-item-actions">
                          {/* Only offered where it does something: a read
                              notification has nothing left to mark */}
                          {!n.read && (
                            <button
                              type="button"
                              className="nt-icon-btn"
                              onClick={() => markRead(n.id)}
                              aria-label={`Mark "${n.title}" as read`}
                              title="Mark as read"
                            >
                              <Check size={13} />
                            </button>
                          )}
                          <button
                            type="button"
                            className="nt-icon-btn is-danger"
                            onClick={() => dismiss(n.id)}
                            aria-label={`Dismiss "${n.title}"`}
                            title="Dismiss"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>

        {/* -------------------------- SIDE RAIL ----------------------- */}
        <aside className="nt-side">
          <div className="nt-card">
            <h2 className="nt-card-title">
              <Settings size={14} /> Delivery
            </h2>

            <div className="nt-pref-head">
              <span />
              <span>Email</span>
              <span>Push</span>
            </div>

            <ul className="nt-pref-list">
              {CHANNELS.map((c) => (
                <li key={c.id}>
                  <span className="nt-pref-body">
                    <b>{c.label}</b>
                    <small>{c.copy}</small>
                  </span>

                  {["email", "push"].map((kind) => (
                    <button
                      key={kind}
                      type="button"
                      role="switch"
                      aria-checked={prefs[c.id][kind]}
                      aria-label={`${c.label} — ${kind}`}
                      className={`nt-switch ${prefs[c.id][kind] ? "is-on" : ""}`}
                      onClick={() => togglePref(c.id, kind)}
                    >
                      <i />
                    </button>
                  ))}
                </li>
              ))}
            </ul>
          </div>

          <div className="nt-card">
            <h2 className="nt-card-title">
              <Moon size={14} /> Quiet Hours
            </h2>

            <p className="nt-note-lead">
              Non-urgent notifications are held during this window. Security
              alerts always come through.
            </p>

            <dl className="nt-summary">
              <div>
                <dt>From</dt>
                <dd>22:00</dd>
              </div>
              <div>
                <dt>Until</dt>
                <dd>07:00</dd>
              </div>
              <div>
                <dt>Timezone</dt>
                <dd>UTC+5:45</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd className="nt-up">Active</dd>
              </div>
            </dl>
          </div>

          <div className="nt-card">
            <h2 className="nt-card-title">
              <ShieldCheck size={14} /> Summary
            </h2>

            <dl className="nt-summary">
              {Object.entries(CATEGORIES).map(([key, meta]) => (
                <div key={key}>
                  <dt>
                    <i
                      className="nt-legend-dot"
                      style={{ backgroundColor: `rgb(${meta.rgb})` }}
                    />
                    {meta.label}
                  </dt>
                  <dd>
                    {items.filter((n) => n.category === key).length}
                    {(perCategory.get(key) || 0) > 0 && (
                      <small className="nt-warn">
                        {" "}
                        {perCategory.get(key)} new
                      </small>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default Notifications;
