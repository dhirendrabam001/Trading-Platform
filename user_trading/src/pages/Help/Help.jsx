import { useMemo, useState } from "react";
import {
  HelpCircle,
  Search,
  BookOpen,
  ChevronDown,
  ArrowRight,
  MessageSquare,
  Play,
  Rocket,
  Wallet,
  TrendingUp,
  ShieldCheck,
  Landmark,
  FileText,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  X,
} from "lucide-react";
import "./Help.css";

/* ================================================================== data ===
   Categories carry no article count of their own - it is DERIVED from the
   articles that belong to them. A hand-written "12 articles" label is exactly
   how a help centre ends up promising more than it holds. */

const CATEGORIES = [
  { id: "start", icon: Rocket, title: "Getting Started", copy: "Open an account, verify, place a first trade." },
  { id: "trading", icon: TrendingUp, title: "Trading", copy: "Order types, charts, positions and fees." },
  { id: "funds", icon: Wallet, title: "Deposits & Withdrawals", copy: "Moving money in and out, networks and limits." },
  { id: "security", icon: ShieldCheck, title: "Security", copy: "2FA, whitelists, and keeping the account safe." },
  { id: "account", icon: Landmark, title: "Account & Verification", copy: "KYC, bank accounts and personal details." },
  { id: "api", icon: FileText, title: "API & Tools", copy: "Keys, permissions and rate limits." },
];

const ARTICLES = [
  { id: "a1",  category: "start",    title: "Creating and verifying your account", read: "4 min", popular: true },
  { id: "a2",  category: "start",    title: "Placing your first trade", read: "6 min", popular: true },
  { id: "a3",  category: "start",    title: "Understanding the dashboard", read: "3 min", popular: false },
  { id: "a4",  category: "trading",  title: "Limit, market and stop orders explained", read: "8 min", popular: true },
  { id: "a5",  category: "trading",  title: "How maker and taker fees are calculated", read: "5 min", popular: true },
  { id: "a6",  category: "trading",  title: "Reading the order book and depth chart", read: "7 min", popular: false },
  { id: "a7",  category: "trading",  title: "Setting take profit and stop loss", read: "5 min", popular: false },
  { id: "a8",  category: "funds",    title: "Why is my withdrawal still pending?", read: "4 min", popular: true },
  { id: "a9",  category: "funds",    title: "Choosing the right deposit network", read: "6 min", popular: true },
  { id: "a10", category: "funds",    title: "Deposit and withdrawal limits by level", read: "3 min", popular: false },
  { id: "a11", category: "security", title: "Setting up two-factor authentication", read: "5 min", popular: true },
  { id: "a12", category: "security", title: "Using a withdrawal whitelist", read: "4 min", popular: false },
  { id: "a13", category: "security", title: "Spotting phishing emails", read: "6 min", popular: false },
  { id: "a14", category: "account",  title: "Getting your KYC documents approved", read: "5 min", popular: true },
  { id: "a15", category: "account",  title: "Linking and verifying a bank account", read: "4 min", popular: false },
  { id: "a16", category: "account",  title: "Changing your registered email", read: "2 min", popular: false },
  { id: "a17", category: "api",      title: "Creating an API key safely", read: "6 min", popular: false },
  { id: "a18", category: "api",      title: "Rate limits and how to stay within them", read: "5 min", popular: false },
];

const FAQS = [
  { id: "f1", category: "funds", q: "How long does a withdrawal take?", a: "Crypto withdrawals are broadcast within minutes and confirm at the pace of the network you chose. Fiat withdrawals take 1–3 business days. If a crypto withdrawal has been pending for over an hour, it is usually network congestion rather than a problem with your account." },
  { id: "f2", category: "funds", q: "I sent funds on the wrong network. Can they be recovered?", a: "Sometimes, but not always, and never automatically. Open a ticket with the transaction hash, the network you used, and the address you sent to. Recovery is manual and can take several weeks." },
  { id: "f3", category: "trading", q: "Why did my limit order not fill?", a: "A limit order only fills at your price or better. If the market never reached your price, it stays open. Check the distance to trigger on the Pending Orders page — if it is far from the current mark, it may sit for a long time." },
  { id: "f4", category: "trading", q: "What is the difference between maker and taker?", a: "You are a maker when your order rests on the book and adds liquidity, and a taker when it executes immediately against an existing order. Makers pay 0.02% and takers pay 0.05%." },
  { id: "f5", category: "security", q: "I lost access to my authenticator app.", a: "Use a backup code if you saved one. If not, open a support ticket from the email registered to the account — you will need to pass identity verification, which typically takes 1–2 business days." },
  { id: "f6", category: "account", q: "Why was my proof of address rejected?", a: "The most common reasons are a document older than three months, a name that does not match your verified identity, or a cropped image where the corners are not visible. A bank statement or utility bill from the last three months works best." },
  { id: "f7", category: "start", q: "What can I do before finishing verification?", a: "You can deposit crypto and trade at Level 1 limits. Fiat withdrawals and higher limits unlock at Level 2, which needs an identity document and proof of address." },
];

const GUIDES = [
  { id: "g1", title: "Placing your first order", length: "4:12" },
  { id: "g2", title: "Reading candlestick charts", length: "7:35" },
  { id: "g3", title: "Securing your account", length: "3:48" },
];

/* ============================================================== derived ===*/

/* Article counts come from the articles themselves, so a category can never
   advertise more than it actually holds */
const withCounts = CATEGORIES.map((c) => ({
  ...c,
  count: ARTICLES.filter((a) => a.category === c.id).length,
}));

const POPULAR = ARTICLES.filter((a) => a.popular);

const categoryTitle = (id) =>
  CATEGORIES.find((c) => c.id === id)?.title || "General";

/* ============================================================= component ===*/

const Help = () => {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(null);
  const [openFaq, setOpenFaq] = useState(FAQS[0].id);
  const [voted, setVoted] = useState(null);

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;

  /* Search spans articles AND questions, because a person looking for
     "withdrawal" does not know or care which of the two holds their answer */
  const results = useMemo(() => {
    if (!searching) return { articles: [], faqs: [] };

    return {
      articles: ARTICLES.filter((a) =>
        `${a.title} ${categoryTitle(a.category)}`.toLowerCase().includes(q),
      ),
      faqs: FAQS.filter((f) => `${f.q} ${f.a}`.toLowerCase().includes(q)),
    };
  }, [q, searching]);

  const resultCount = results.articles.length + results.faqs.length;

  /* Browsing a category is a separate mode from searching: picking one clears
     the query so the page never shows results filtered two ways at once */
  const browsing = !searching && category !== null;
  const browseArticles = browsing
    ? ARTICLES.filter((a) => a.category === category)
    : [];

  const pickCategory = (id) => {
    setQuery("");
    setCategory(category === id ? null : id);
  };

  const visibleFaqs = browsing
    ? FAQS.filter((f) => f.category === category)
    : FAQS;

  return (
    <section className="hp-page">
      {/* ============================= HERO ============================ */}
      <div className="hp-card hp-hero">
        <span className="hp-hero-icon">
          <HelpCircle size={22} />
        </span>

        <h1 className="hp-title">How can we help?</h1>
        <p className="hp-subtitle">
          Search {ARTICLES.length} articles and {FAQS.length} common questions,
          or browse by topic below.
        </p>

        <div className="hp-search">
          <Search size={16} />
          <input
            type="search"
            value={query}
            placeholder="Search for an answer..."
            aria-label="Search the help centre"
            onChange={(e) => {
              setQuery(e.target.value);
              // Searching supersedes browsing, so clear the category
              if (e.target.value.trim()) setCategory(null);
            }}
          />
          {query && (
            <button
              type="button"
              className="hp-clear"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {searching && (
          <p className="hp-result-count">
            {resultCount === 0
              ? `Nothing found for “${query.trim()}”`
              : `${resultCount} result${resultCount === 1 ? "" : "s"} for “${query.trim()}”`}
          </p>
        )}
      </div>

      {/* =========================== CATEGORIES ======================== */}
      {!searching && (
        <div className="hp-categories">
          {withCounts.map(({ id, icon: Icon, title, copy, count }) => (
            <button
              key={id}
              type="button"
              className={`hp-card hp-category ${category === id ? "is-active" : ""}`}
              aria-pressed={category === id}
              onClick={() => pickCategory(id)}
            >
              <span className="hp-cat-icon">
                <Icon size={17} />
              </span>
              <span className="hp-cat-body">
                <b>{title}</b>
                <small>{copy}</small>
              </span>
              <span className="hp-cat-count">
                {count} article{count === 1 ? "" : "s"}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ============================= GRID ============================ */}
      <div className="hp-grid">
        <div className="hp-col-main">
          {/* ------------------------- RESULTS ----------------------- */}
          {searching && (
            <div className="hp-card">
              <h2 className="hp-card-title">
                <Search size={14} /> Search Results
              </h2>

              {resultCount === 0 ? (
                <div className="hp-empty">
                  <BookOpen size={20} />
                  <p>
                    No article or question matches “{query.trim()}”. Try a
                    broader term, or open a support ticket.
                  </p>
                  <button type="button" className="hp-btn hp-btn--primary">
                    <MessageSquare size={14} /> Contact support
                  </button>
                </div>
              ) : (
                <>
                  {results.articles.length > 0 && (
                    <>
                      <p className="hp-result-label">
                        Articles ({results.articles.length})
                      </p>
                      <ul className="hp-articles">
                        {results.articles.map((a) => (
                          <li key={a.id}>
                            <a href="#article">
                              <span className="hp-article-body">
                                <b>{a.title}</b>
                                <small>
                                  {categoryTitle(a.category)} · {a.read} read
                                </small>
                              </span>
                              <ArrowRight size={14} />
                            </a>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  {results.faqs.length > 0 && (
                    <>
                      <p className="hp-result-label">
                        Questions ({results.faqs.length})
                      </p>
                      <ul className="hp-faqs">
                        {results.faqs.map((f) => (
                          <li key={f.id} className="hp-faq is-open">
                            <div className="hp-faq-q">
                              <b>{f.q}</b>
                            </div>
                            <div className="hp-faq-a">
                              <p>{f.a}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* ------------------------- BROWSING ---------------------- */}
          {browsing && (
            <div className="hp-card">
              <div className="hp-card-head">
                <h2 className="hp-card-title">
                  <BookOpen size={14} /> {categoryTitle(category)}
                </h2>
                <button
                  type="button"
                  className="hp-mini-btn"
                  onClick={() => setCategory(null)}
                >
                  <X size={12} /> Clear
                </button>
              </div>

              <ul className="hp-articles">
                {browseArticles.map((a) => (
                  <li key={a.id}>
                    <a href="#article">
                      <span className="hp-article-body">
                        <b>{a.title}</b>
                        <small>{a.read} read</small>
                      </span>
                      <ArrowRight size={14} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* --------------------------- FAQ ------------------------- */}
          {!searching && (
            <div className="hp-card">
              <h2 className="hp-card-title">
                <HelpCircle size={14} />
                {browsing
                  ? `${categoryTitle(category)} Questions`
                  : "Common Questions"}
              </h2>

              {visibleFaqs.length === 0 ? (
                <p className="hp-muted">
                  No questions filed under this topic yet — the articles above
                  cover it.
                </p>
              ) : (
                <ul className="hp-faqs">
                  {visibleFaqs.map((f) => {
                    const open = openFaq === f.id;

                    return (
                      <li
                        key={f.id}
                        className={`hp-faq ${open ? "is-open" : ""}`}
                      >
                        <button
                          type="button"
                          className="hp-faq-q"
                          aria-expanded={open}
                          onClick={() => setOpenFaq(open ? null : f.id)}
                        >
                          <b>{f.q}</b>
                          <ChevronDown
                            size={15}
                            className={open ? "is-flipped" : ""}
                          />
                        </button>

                        {open && (
                          <div className="hp-faq-a">
                            <p>{f.a}</p>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {/* ------------------------- POPULAR ----------------------- */}
          {!searching && !browsing && (
            <div className="hp-card">
              <h2 className="hp-card-title">
                <TrendingUp size={14} /> Most Read
              </h2>

              <ul className="hp-articles">
                {POPULAR.map((a) => (
                  <li key={a.id}>
                    <a href="#article">
                      <span className="hp-article-body">
                        <b>{a.title}</b>
                        <small>
                          {categoryTitle(a.category)} · {a.read} read
                        </small>
                      </span>
                      <ArrowRight size={14} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* -------------------------- SIDE RAIL ----------------------- */}
        <aside className="hp-side">
          <div className="hp-card hp-contact">
            <h2 className="hp-card-title">
              <MessageSquare size={14} /> Still stuck?
            </h2>

            <p className="hp-note-lead">
              If none of this answers your question, open a ticket. Most first
              replies land within an hour.
            </p>

            <button type="button" className="hp-btn hp-btn--primary">
              <MessageSquare size={14} /> Contact support
            </button>

            <p className="hp-note">
              Include any transaction IDs and what you already tried — it saves
              a round trip.
            </p>
          </div>

          <div className="hp-card">
            <h2 className="hp-card-title">
              <Play size={14} /> Video Guides
            </h2>

            <ul className="hp-guides">
              {GUIDES.map((g) => (
                <li key={g.id}>
                  <a href="#guide">
                    <span className="hp-play">
                      <Play size={12} />
                    </span>
                    <span className="hp-guide-body">
                      <b>{g.title}</b>
                      <small>{g.length}</small>
                    </span>
                    <ExternalLink size={13} />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="hp-card">
            <h2 className="hp-card-title">
              <BookOpen size={14} /> Was this useful?
            </h2>

            <p className="hp-note-lead">
              Your answer helps us decide what to write next.
            </p>

            <div className="hp-vote">
              <button
                type="button"
                className={`hp-vote-btn ${voted === "up" ? "is-up" : ""}`}
                aria-pressed={voted === "up"}
                onClick={() => setVoted(voted === "up" ? null : "up")}
              >
                <ThumbsUp size={14} /> Yes
              </button>
              <button
                type="button"
                className={`hp-vote-btn ${voted === "down" ? "is-down" : ""}`}
                aria-pressed={voted === "down"}
                onClick={() => setVoted(voted === "down" ? null : "down")}
              >
                <ThumbsDown size={14} /> No
              </button>
            </div>

            {voted && (
              <p className="hp-note">
                {voted === "up"
                  ? "Thanks — noted."
                  : "Sorry to hear it. Opening a ticket will get you a human."}
              </p>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
};

export default Help;
