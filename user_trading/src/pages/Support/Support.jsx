import { useMemo, useState } from "react";
import {
  Headphones,
  MessageSquare,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Send,
  Paperclip,
  Mail,
  Phone,
  BookOpen,
  ExternalLink,
  Star,
  X,
} from "lucide-react";
import "./Support.css";

/* ================================================================== data ===
   Only each ticket's own facts are stored - status, priority, and its
   messages. Whether it counts as OPEN, how many replies are unread, and the
   response target it is held to are all DERIVED, so the counters at the top
   cannot disagree with the list beneath them. */

const PRIORITIES = {
  Urgent: { weight: 3, target: "under 1 hour", rgb: "232, 65, 66" },
  High: { weight: 2, target: "under 4 hours", rgb: "245, 158, 11" },
  Normal: { weight: 1, target: "within 24 hours", rgb: "59, 130, 246" },
  Low: { weight: 0, target: "within 2 days", rgb: "123, 137, 155" },
};

/* A ticket is open until it is resolved or closed. Defining it once means the
   metric, the tab and the badge can never draw the line differently. */
const OPEN_STATUSES = ["Awaiting Reply", "In Progress", "Awaiting You"];
const isOpen = (ticket) => OPEN_STATUSES.includes(ticket.status);

const STATUS_META = {
  "Awaiting Reply": { icon: Clock, tone: "warn" },
  "In Progress": { icon: MessageSquare, tone: "info" },
  "Awaiting You": { icon: AlertTriangle, tone: "warn" },
  Resolved: { icon: CheckCircle2, tone: "done" },
  Closed: { icon: X, tone: "idle" },
};

const TICKETS = [
  {
    id: "TKT-4821",
    subject: "Withdrawal stuck in pending",
    category: "Withdrawals",
    priority: "Urgent",
    status: "In Progress",
    opened: "12 Aug, 09:41",
    updated: "12 Aug, 10:18",
    unread: 1,
    messages: [
      { from: "you", author: "You", time: "12 Aug, 09:41", body: "My 0.15 BTC withdrawal has been pending for over three hours. The transaction hash has not appeared yet." },
      { from: "agent", author: "Sujata (Support)", time: "12 Aug, 10:02", body: "Thanks for flagging this. I can see the withdrawal queued behind a network congestion backlog. I am escalating it now." },
      { from: "agent", author: "Sujata (Support)", time: "12 Aug, 10:18", body: "It has been rebroadcast with a higher fee and should confirm within the next 20 minutes. I will keep this open until it lands." },
    ],
  },
  {
    id: "TKT-4816",
    subject: "Proof of address rejected",
    category: "Verification",
    priority: "High",
    status: "Awaiting You",
    opened: "11 Aug, 14:22",
    updated: "11 Aug, 16:05",
    unread: 2,
    messages: [
      { from: "you", author: "You", time: "11 Aug, 14:22", body: "My utility bill was rejected but it is only two months old." },
      { from: "agent", author: "Bikash (Verification)", time: "11 Aug, 15:40", body: "The document you uploaded is dated 14 April, which puts it outside our three-month window." },
      { from: "agent", author: "Bikash (Verification)", time: "11 Aug, 16:05", body: "Could you upload a statement dated within the last three months? A bank statement or a council tax bill both work." },
    ],
  },
  {
    id: "TKT-4802",
    subject: "API key permissions question",
    category: "API",
    priority: "Normal",
    status: "Awaiting Reply",
    opened: "10 Aug, 11:07",
    updated: "10 Aug, 11:07",
    unread: 0,
    messages: [
      { from: "you", author: "You", time: "10 Aug, 11:07", body: "Can a read-only API key place orders if IP whitelisting is disabled? I want to be sure before I generate one." },
    ],
  },
  {
    id: "TKT-4788",
    subject: "Fee tier not updated after volume",
    category: "Fees",
    priority: "Normal",
    status: "Resolved",
    opened: "08 Aug, 19:33",
    updated: "09 Aug, 09:12",
    unread: 0,
    messages: [
      { from: "you", author: "You", time: "08 Aug, 19:33", body: "My 30-day volume passed the maker tier threshold but my fees have not changed." },
      { from: "agent", author: "Anjali (Support)", time: "09 Aug, 08:45", body: "Tiers recalculate at 00:00 UTC. Yours updated overnight and you are now on the 0.02% maker tier." },
      { from: "you", author: "You", time: "09 Aug, 09:12", body: "Confirmed, thank you." },
    ],
  },
  {
    id: "TKT-4771",
    subject: "Change registered email address",
    category: "Account",
    priority: "Low",
    status: "Closed",
    opened: "05 Aug, 08:14",
    updated: "06 Aug, 12:40",
    unread: 0,
    messages: [
      { from: "you", author: "You", time: "05 Aug, 08:14", body: "How do I change the email on my account?" },
      { from: "agent", author: "Anjali (Support)", time: "06 Aug, 12:40", body: "You can change it under Profile → Personal Information. It requires a 2FA confirmation." },
    ],
  },
];

const TABS = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "Awaiting You", label: "Needs You" },
  { id: "Resolved", label: "Resolved" },
];

const CHANNELS = [
  { id: "chat", icon: MessageSquare, title: "Live Chat", copy: "Fastest for anything urgent", status: "Online now", tone: "up" },
  { id: "email", icon: Mail, title: "Email", copy: "support@tradingplatform.io", status: "Replies in ~4h", tone: "neutral" },
  { id: "phone", icon: Phone, title: "Phone", copy: "+977 1 4000 000", status: "09:00 – 18:00 NPT", tone: "neutral" },
];

const ARTICLES = [
  { id: "h1", title: "Why is my withdrawal pending?", cat: "Withdrawals" },
  { id: "h2", title: "Getting your documents approved first time", cat: "Verification" },
  { id: "h3", title: "How maker and taker fees are calculated", cat: "Fees" },
  { id: "h4", title: "Securing your account with 2FA", cat: "Security" },
];

const CATEGORIES = ["Withdrawals", "Deposits", "Verification", "Trading", "Fees", "API", "Account", "Other"];

/* ============================================================= component ===*/

const Support = () => {
  const [tickets] = useState(TICKETS);
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(TICKETS[0].id);
  const [composing, setComposing] = useState(false);
  const [reply, setReply] = useState("");

  /* Counts read from the list itself, never tracked beside it */
  const stats = useMemo(() => {
    const open = tickets.filter(isOpen);
    return {
      total: tickets.length,
      open: open.length,
      resolved: tickets.filter((t) => t.status === "Resolved").length,
      needsYou: tickets.filter((t) => t.status === "Awaiting You").length,
      unread: tickets.reduce((sum, t) => sum + t.unread, 0),
    };
  }, [tickets]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return tickets
      .filter((t) => {
        if (q && !`${t.id} ${t.subject} ${t.category}`.toLowerCase().includes(q)) {
          return false;
        }
        if (tab === "open") return isOpen(t);
        if (tab !== "all") return t.status === tab;
        return true;
      })
      /* Open tickets first, then by priority weight, then most recently
         updated - so the thing most likely to need attention is on top */
      .sort((a, b) => {
        if (isOpen(a) !== isOpen(b)) return isOpen(a) ? -1 : 1;
        const pri = PRIORITIES[b.priority].weight - PRIORITIES[a.priority].weight;
        if (pri !== 0) return pri;
        return b.updated.localeCompare(a.updated);
      });
  }, [tickets, tab, query]);

  const metrics = [
    {
      key: "open",
      icon: MessageSquare,
      label: "Open Tickets",
      value: String(stats.open),
      sub:
        stats.needsYou > 0
          ? `${stats.needsYou} waiting on you`
          : "Nothing waiting on you",
      tone: stats.needsYou > 0 ? "warn" : "neutral",
    },
    {
      key: "unread",
      icon: AlertTriangle,
      label: "Unread Replies",
      value: String(stats.unread),
      sub: stats.unread > 0 ? "Across your tickets" : "You are up to date",
      tone: stats.unread > 0 ? "warn" : "up",
    },
    {
      key: "resolved",
      icon: CheckCircle2,
      label: "Resolved",
      value: String(stats.resolved),
      sub: `of ${stats.total} total`,
      tone: "up",
    },
    {
      key: "response",
      icon: Clock,
      label: "Avg. First Reply",
      value: "42 min",
      sub: "Last 30 days",
      tone: "neutral",
    },
  ];

  return (
    <section className="sp-page">
      {/* ============================ HEADER =========================== */}
      <header className="sp-header">
        <div className="sp-heading">
          <span className="sp-heading-icon">
            <Headphones size={19} />
          </span>
          <div>
            <h1 className="sp-title">Support</h1>
            <p className="sp-subtitle">
              Open a ticket, follow a conversation, or reach us directly. Most
              first replies land within an hour.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="sp-btn sp-btn--primary"
          onClick={() => setComposing((v) => !v)}
          aria-expanded={composing}
        >
          {composing ? <X size={14} /> : <Plus size={14} />}
          {composing ? "Cancel" : "New Ticket"}
        </button>
      </header>

      {/* ============================ METRICS ========================== */}
      <div className="sp-metrics">
        {metrics.map(({ key, icon: Icon, label, value, sub, tone }) => (
          <div className={`sp-card sp-metric is-${tone}`} key={key}>
            <span className="sp-metric-icon">
              <Icon size={16} />
            </span>
            <div className="sp-metric-body">
              <span className="sp-metric-label">{label}</span>
              <strong className="sp-metric-value">{value}</strong>
              <span className="sp-metric-sub">{sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ============================= GRID ============================ */}
      <div className="sp-grid">
        <div className="sp-col-main">
          {/* ------------------------ NEW TICKET --------------------- */}
          {composing && (
            <div className="sp-card sp-compose">
              <h2 className="sp-card-title">
                <Plus size={14} /> Open a Ticket
              </h2>

              <div className="sp-form">
                <div className="sp-field">
                  <label htmlFor="sp-cat">Category</label>
                  <select id="sp-cat">
                    {CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="sp-field">
                  <label htmlFor="sp-pri">Priority</label>
                  <select id="sp-pri" defaultValue="Normal">
                    {Object.keys(PRIORITIES).map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div className="sp-field sp-field--wide">
                  <label htmlFor="sp-subject">Subject</label>
                  <input
                    id="sp-subject"
                    type="text"
                    placeholder="Summarise the problem in one line"
                  />
                </div>
                <div className="sp-field sp-field--wide">
                  <label htmlFor="sp-body">Describe the issue</label>
                  <textarea
                    id="sp-body"
                    rows="5"
                    placeholder="Include any transaction IDs, timestamps and what you already tried."
                  />
                </div>
              </div>

              <div className="sp-compose-foot">
                <button type="button" className="sp-mini-btn">
                  <Paperclip size={12} /> Attach file
                </button>
                <button type="button" className="sp-btn sp-btn--primary">
                  <Send size={14} /> Submit ticket
                </button>
              </div>
            </div>
          )}

          {/* -------------------------- TICKETS ---------------------- */}
          <div className="sp-card">
            <div className="sp-toolbar">
              <div className="sp-tabs" role="tablist" aria-label="Filter tickets">
                {TABS.map((t) => {
                  const count =
                    t.id === "all"
                      ? tickets.length
                      : t.id === "open"
                        ? stats.open
                        : tickets.filter((x) => x.status === t.id).length;

                  return (
                    <button
                      key={t.id}
                      type="button"
                      role="tab"
                      aria-selected={tab === t.id}
                      className={`sp-tab ${tab === t.id ? "is-active" : ""}`}
                      onClick={() => setTab(t.id)}
                    >
                      {t.label}
                      <span className="sp-tab-count">{count}</span>
                    </button>
                  );
                })}
              </div>

              <div className="sp-search">
                <Search size={14} />
                <input
                  type="search"
                  value={query}
                  placeholder="Search tickets..."
                  aria-label="Search tickets"
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="sp-empty">
                <MessageSquare size={20} />
                <p>No tickets match this filter.</p>
              </div>
            ) : (
              <ul className="sp-tickets">
                {filtered.map((t) => {
                  const meta = STATUS_META[t.status];
                  const StatusIcon = meta.icon;
                  const open = expanded === t.id;
                  const pri = PRIORITIES[t.priority];

                  return (
                    <li
                      key={t.id}
                      className={`sp-ticket is-${meta.tone} ${open ? "is-open" : ""}`}
                      style={{ "--pri-rgb": pri.rgb }}
                    >
                      <button
                        type="button"
                        className="sp-ticket-head"
                        aria-expanded={open}
                        onClick={() => setExpanded(open ? null : t.id)}
                      >
                        <span className="sp-ticket-main">
                          <span className="sp-ticket-top">
                            <b>{t.subject}</b>
                            {t.unread > 0 && (
                              <span className="sp-unread">
                                {t.unread} new
                              </span>
                            )}
                          </span>
                          <span className="sp-ticket-meta">
                            <span className="sp-id">{t.id}</span>
                            <span className="sp-dot-sep" />
                            <span>{t.category}</span>
                            <span className="sp-dot-sep" />
                            <span>Updated {t.updated}</span>
                          </span>
                        </span>

                        <span className="sp-ticket-tags">
                          <span className="sp-priority">{t.priority}</span>
                          <span className={`sp-status is-${meta.tone}`}>
                            <StatusIcon size={11} />
                            {t.status}
                          </span>
                          <ChevronDown
                            size={15}
                            className={`sp-chev ${open ? "is-flipped" : ""}`}
                          />
                        </span>
                      </button>

                      {open && (
                        <div className="sp-thread">
                          <p className="sp-sla">
                            <Clock size={11} />
                            {t.priority} priority — first reply {pri.target}
                          </p>

                          <ul className="sp-messages">
                            {t.messages.map((m, i) => (
                              <li
                                key={`${t.id}-${i}`}
                                className={`sp-msg is-${m.from}`}
                              >
                                <div className="sp-msg-head">
                                  <b>{m.author}</b>
                                  <small>{m.time}</small>
                                </div>
                                <p>{m.body}</p>
                              </li>
                            ))}
                          </ul>

                          {/* A closed conversation cannot be replied to -
                              offering the box would be a dead end */}
                          {isOpen(t) ? (
                            <div className="sp-reply">
                              <textarea
                                rows="3"
                                value={reply}
                                placeholder="Write a reply..."
                                aria-label={`Reply to ${t.id}`}
                                onChange={(e) => setReply(e.target.value)}
                              />
                              <div className="sp-reply-foot">
                                <button type="button" className="sp-mini-btn">
                                  <Paperclip size={12} /> Attach
                                </button>
                                <button
                                  type="button"
                                  className="sp-btn sp-btn--primary"
                                  disabled={reply.trim().length === 0}
                                >
                                  <Send size={13} /> Send reply
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="sp-closed-note">
                              This ticket is {t.status.toLowerCase()}. Reply to
                              reopen it, or open a new ticket.
                            </p>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* -------------------------- SIDE RAIL ----------------------- */}
        <aside className="sp-side">
          <div className="sp-card">
            <h2 className="sp-card-title">
              <Headphones size={14} /> Reach Us
            </h2>

            <ul className="sp-channels">
              {CHANNELS.map(({ id, icon: Icon, title, copy, status, tone }) => (
                <li key={id}>
                  <span className="sp-channel-icon">
                    <Icon size={15} />
                  </span>
                  <span className="sp-channel-body">
                    <b>{title}</b>
                    <small>{copy}</small>
                  </span>
                  <span className={`sp-channel-status is-${tone}`}>
                    {status}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="sp-card">
            <h2 className="sp-card-title">
              <Clock size={14} /> Response Targets
            </h2>

            <dl className="sp-summary">
              {Object.entries(PRIORITIES).map(([name, p]) => (
                <div key={name}>
                  <dt>
                    <i
                      className="sp-pri-dot"
                      style={{ backgroundColor: `rgb(${p.rgb})` }}
                    />
                    {name}
                  </dt>
                  <dd>{p.target}</dd>
                </div>
              ))}
            </dl>

            <p className="sp-note">
              Targets are for the first human reply, not resolution. Urgent is
              reserved for funds at risk.
            </p>
          </div>

          <div className="sp-card">
            <h2 className="sp-card-title">
              <BookOpen size={14} /> Help Articles
            </h2>

            <ul className="sp-articles">
              {ARTICLES.map((a) => (
                <li key={a.id}>
                  <a href="#article">
                    <span className="sp-article-body">
                      <b>{a.title}</b>
                      <small>{a.cat}</small>
                    </span>
                    <ExternalLink size={13} />
                  </a>
                </li>
              ))}
            </ul>

            <div className="sp-rating">
              <span className="sp-muted">Was this helpful?</span>
              <span className="sp-stars">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} size={13} />
                ))}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default Support;
