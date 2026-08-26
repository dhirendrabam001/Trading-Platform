import { useMemo, useState } from "react";
import {
  ArrowUpCircle,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  History,
  Wallet,
  Info,
  Lock,
  Gauge,
  BookUser,
} from "lucide-react";
import "./Withdraw.css";

/* ================================================================== data ===
   Each asset carries its own balance and networks, and each network its own
   fee, minimum and address pattern. Everything the form shows - the fee, the
   amount you will receive, whether the entry is valid - is DERIVED from the
   selected pair, so the figures on screen can never describe a different
   chain than the one selected. */

const ASSETS = [
  {
    sym: "USDT",
    name: "Tether",
    key: "usdt",
    available: 24562.34,
    price: 1,
    networks: [
      { id: "erc20", label: "Ethereum (ERC-20)", fee: 4.2, min: 20, eta: "~5 min", pattern: /^0x[a-fA-F0-9]{40}$/, hint: "0x…" },
      { id: "trc20", label: "Tron (TRC-20)", fee: 1.0, min: 10, eta: "~2 min", pattern: /^T[1-9A-HJ-NP-Za-km-z]{33}$/, hint: "T…" },
      { id: "bep20", label: "BNB Smart Chain (BEP-20)", fee: 0.5, min: 10, eta: "~3 min", pattern: /^0x[a-fA-F0-9]{40}$/, hint: "0x…" },
    ],
  },
  {
    sym: "BTC",
    name: "Bitcoin",
    key: "btc",
    available: 0.967,
    price: 67245.8,
    networks: [
      { id: "btc", label: "Bitcoin", fee: 0.0002, min: 0.001, eta: "~20 min", pattern: /^(bc1[a-z0-9]{25,62}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/, hint: "bc1… or 1…" },
      { id: "bep20", label: "BNB Smart Chain (BEP-20)", fee: 0.00001, min: 0.0001, eta: "~3 min", pattern: /^0x[a-fA-F0-9]{40}$/, hint: "0x…" },
    ],
  },
  {
    sym: "ETH",
    name: "Ethereum",
    key: "eth",
    available: 11.65,
    price: 3512.75,
    networks: [
      { id: "erc20", label: "Ethereum (ERC-20)", fee: 0.0012, min: 0.01, eta: "~5 min", pattern: /^0x[a-fA-F0-9]{40}$/, hint: "0x…" },
      { id: "arbitrum", label: "Arbitrum One", fee: 0.0001, min: 0.002, eta: "~1 min", pattern: /^0x[a-fA-F0-9]{40}$/, hint: "0x…" },
    ],
  },
  {
    sym: "SOL",
    name: "Solana",
    key: "sol",
    available: 194.2,
    price: 142.35,
    networks: [
      { id: "sol", label: "Solana", fee: 0.01, min: 0.05, eta: "~30 sec", pattern: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/, hint: "Base58 address" },
    ],
  },
  {
    sym: "BNB",
    name: "BNB",
    key: "bnb",
    available: 29.4,
    price: 602.45,
    networks: [
      { id: "bep20", label: "BNB Smart Chain (BEP-20)", fee: 0.0005, min: 0.01, eta: "~3 min", pattern: /^0x[a-fA-F0-9]{40}$/, hint: "0x…" },
    ],
  },
];

/* Asset-brand colours: these identify a coin, not a surface, so they are
   deliberately literal and stay fixed in both themes. */
const COIN_COLORS = {
  usdt: "#26a17b",
  btc: "#f7931a",
  eth: "#627eea",
  sol: "#14f195",
  bnb: "#f3ba2f",
};

/* 24 hour limit, in USD, and how much of it is already spent */
const DAILY_LIMIT = 50000;
const DAILY_USED = 12400;

const PERCENTS = [25, 50, 75, 100];

const SAVED_ADDRESSES = [
  { id: "a1", label: "Ledger cold wallet", network: "erc20", address: "0x9E12aC4b8Df6510e7B3d2A81fC0e45D7b6a1E883" },
  { id: "a2", label: "Binance main", network: "trc20", address: "TQn9Y2khEsLJW1ChVWFMSMeRDow5oREqjK" },
];

const RECENT = [
  { id: "w1", sym: "USDT", key: "usdt", amount: 5000,  network: "TRC-20",  status: "Completed", time: "12 Aug, 08:14" },
  { id: "w2", sym: "BTC",  key: "btc",  amount: 0.15,  network: "Bitcoin", status: "Completed", time: "11 Aug, 18:22" },
  { id: "w3", sym: "ETH",  key: "eth",  amount: 2.4,   network: "ERC-20",  status: "Pending",   time: "11 Aug, 12:47" },
  { id: "w4", sym: "SOL",  key: "sol",  amount: 62,    network: "Solana",  status: "Completed", time: "09 Aug, 11:17" },
  { id: "w5", sym: "USDT", key: "usdt", amount: 2400,  network: "ERC-20",  status: "Rejected",  time: "07 Aug, 15:03" },
];

/* =============================================================== format ===*/

const money = (value, dp = 2) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });

/* Crypto amounts need enough precision that a fee of 0.0002 BTC is visible;
   a flat 2dp would render it as 0.00 */
const coin = (value) => money(value, value < 1 ? 6 : value < 1000 ? 4 : 2);

/* ============================================================ validation ===
   A pure function so the form, the submit button and the summary all reach
   the same verdict from one place - and so it can be tested directly.

   Order matters: the most specific problem is reported first, otherwise a
   user typing "0.00001" would be told "below the minimum" when the real
   issue is that the fee already exceeds it. */
export const validateWithdrawal = ({ amount, address, asset, network, dailyRemaining }) => {
  const trimmed = (address || "").trim();

  if (!trimmed) return { ok: false, field: "address", message: "Enter a destination address." };
  if (!network.pattern.test(trimmed)) {
    return {
      ok: false,
      field: "address",
      message: `That is not a valid ${network.label} address (${network.hint}).`,
    };
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, field: "amount", message: "Enter an amount." };
  }
  if (amount > asset.available) {
    return {
      ok: false,
      field: "amount",
      message: `Only ${coin(asset.available)} ${asset.sym} available.`,
    };
  }
  if (amount < network.min) {
    return {
      ok: false,
      field: "amount",
      message: `Minimum withdrawal is ${coin(network.min)} ${asset.sym}.`,
    };
  }
  /* The fee comes out of the amount, so an amount at or below the fee would
     send nothing while still spending the balance */
  if (amount <= network.fee) {
    return {
      ok: false,
      field: "amount",
      message: `Amount must exceed the ${coin(network.fee)} ${asset.sym} network fee.`,
    };
  }
  if (amount * asset.price > dailyRemaining) {
    return {
      ok: false,
      field: "amount",
      message: `Exceeds your remaining 24h limit of $${money(dailyRemaining)}.`,
    };
  }

  return { ok: true, field: null, message: "" };
};

/* ============================================================ components ===*/

const CoinMark = ({ coinKey, sym, size }) => (
  <span
    className={`wd-coin${size ? ` wd-coin--${size}` : ""}`}
    style={{ backgroundColor: COIN_COLORS[coinKey] || "#6b7280" }}
    aria-hidden="true"
  >
    {sym.charAt(0)}
  </span>
);

/* ============================================================= component ===*/

const Withdraw = () => {
  const [assetSym, setAssetSym] = useState("USDT");
  const [networkId, setNetworkId] = useState("trc20");
  const [query, setQuery] = useState("");
  const [address, setAddress] = useState("");
  const [amountText, setAmountText] = useState("");
  const [touched, setTouched] = useState(false);

  const asset = useMemo(
    () => ASSETS.find((a) => a.sym === assetSym) || ASSETS[0],
    [assetSym],
  );

  /* If the previously chosen network is not offered by the new asset, fall
     back to that asset's first network rather than quoting a fee for a chain
     this coin does not support. */
  const network = useMemo(
    () => asset.networks.find((n) => n.id === networkId) || asset.networks[0],
    [asset, networkId],
  );

  const dailyRemaining = Math.max(0, DAILY_LIMIT - DAILY_USED);
  const amount = parseFloat(amountText);

  const check = useMemo(
    () =>
      validateWithdrawal({
        amount,
        address,
        asset,
        network,
        dailyRemaining,
      }),
    [amount, address, asset, network, dailyRemaining],
  );

  /* Only what actually leaves the network reaches the destination */
  const receive = Number.isFinite(amount)
    ? Math.max(0, amount - network.fee)
    : 0;
  const usdValue = Number.isFinite(amount) ? amount * asset.price : 0;

  const pickAsset = (sym) => {
    const next = ASSETS.find((a) => a.sym === sym);
    setAssetSym(sym);
    if (next && !next.networks.some((n) => n.id === networkId)) {
      setNetworkId(next.networks[0].id);
    }
    // The amount was expressed in the previous coin, so it is meaningless now
    setAmountText("");
    setTouched(false);
  };

  const applyPercent = (pct) => {
    setAmountText(((asset.available * pct) / 100).toFixed(6));
    setTouched(true);
  };

  const filteredAssets = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ASSETS;
    return ASSETS.filter((a) => `${a.sym} ${a.name}`.toLowerCase().includes(q));
  }, [query]);

  const usableSaved = SAVED_ADDRESSES.filter(
    (s) => s.network === network.id,
  );

  const showError = touched && !check.ok;

  const metrics = [
    {
      key: "available",
      icon: Wallet,
      label: "Available",
      value: `${coin(asset.available)} ${asset.sym}`,
      sub: `≈ $${money(asset.available * asset.price)}`,
      tone: "neutral",
    },
    {
      key: "limit",
      icon: Gauge,
      label: "24h Limit Left",
      value: `$${money(dailyRemaining, 0)}`,
      sub: `of $${money(DAILY_LIMIT, 0)} daily`,
      tone: dailyRemaining < DAILY_LIMIT * 0.25 ? "warn" : "up",
    },
    {
      key: "pending",
      icon: Clock,
      label: "Pending",
      value: String(RECENT.filter((r) => r.status === "Pending").length),
      sub: "Awaiting approval",
      tone: "neutral",
    },
    {
      key: "total",
      icon: ArrowUpCircle,
      label: "Total Withdrawn",
      value: "$96,320.00",
      sub: "All time",
      tone: "neutral",
    },
  ];

  return (
    <section className="wd-page">
      {/* ============================ HEADER =========================== */}
      <header className="wd-header">
        <div className="wd-heading">
          <span className="wd-heading-icon">
            <ArrowUpCircle size={19} />
          </span>
          <div>
            <h1 className="wd-title">Withdraw</h1>
            <p className="wd-subtitle">
              Send funds to an external wallet. Check the network and address
              carefully — transfers cannot be reversed.
            </p>
          </div>
        </div>

        <div className="wd-header-actions">
          <button type="button" className="wd-btn wd-btn--ghost">
            <History size={14} /> Withdrawal History
          </button>
        </div>
      </header>

      {/* ============================ METRICS ========================== */}
      <div className="wd-metrics">
        {metrics.map(({ key, icon: Icon, label, value, sub, tone }) => (
          <div className={`wd-card wd-metric is-${tone}`} key={key}>
            <span className="wd-metric-icon">
              <Icon size={16} />
            </span>
            <div className="wd-metric-body">
              <span className="wd-metric-label">{label}</span>
              <strong className="wd-metric-value">{value}</strong>
              <span className="wd-metric-sub">{sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ============================= GRID ============================ */}
      <div className="wd-grid">
        <div className="wd-col-main">
          {/* --------------------- STEP 1: ASSET --------------------- */}
          <div className="wd-card">
            <div className="wd-step-head">
              <span className="wd-step-num">1</span>
              <div>
                <h2 className="wd-card-title">Select Asset</h2>
                <p className="wd-step-note">Choose what you want to send.</p>
              </div>

              <div className="wd-search">
                <Search size={14} />
                <input
                  type="search"
                  value={query}
                  placeholder="Search asset..."
                  aria-label="Search assets"
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="wd-asset-grid" role="radiogroup" aria-label="Asset">
              {filteredAssets.map((a) => (
                <button
                  key={a.sym}
                  type="button"
                  role="radio"
                  aria-checked={a.sym === assetSym}
                  className={`wd-asset ${a.sym === assetSym ? "is-active" : ""}`}
                  onClick={() => pickAsset(a.sym)}
                >
                  <CoinMark coinKey={a.key} sym={a.sym} />
                  <span className="wd-asset-text">
                    <b>{a.sym}</b>
                    <small>{coin(a.available)} available</small>
                  </span>
                </button>
              ))}

              {filteredAssets.length === 0 && (
                <p className="wd-muted wd-no-asset">
                  No asset matches that search.
                </p>
              )}
            </div>
          </div>

          {/* -------------------- STEP 2: NETWORK -------------------- */}
          <div className="wd-card">
            <div className="wd-step-head">
              <span className="wd-step-num">2</span>
              <div>
                <h2 className="wd-card-title">Select Network</h2>
                <p className="wd-step-note">
                  Must match the network your destination wallet supports.
                </p>
              </div>
            </div>

            <div className="wd-network-list" role="radiogroup" aria-label="Network">
              {asset.networks.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  role="radio"
                  aria-checked={n.id === network.id}
                  className={`wd-network ${n.id === network.id ? "is-active" : ""}`}
                  onClick={() => setNetworkId(n.id)}
                >
                  <span className="wd-network-main">
                    <b>{n.label}</b>
                    <small>
                      Min {coin(n.min)} {asset.sym} · arrives {n.eta}
                    </small>
                  </span>
                  <span className="wd-network-meta">
                    <b>
                      {coin(n.fee)} {asset.sym}
                    </b>
                    <small>network fee</small>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* --------------------- STEP 3: DETAILS ------------------- */}
          <div className="wd-card">
            <div className="wd-step-head">
              <span className="wd-step-num">3</span>
              <div>
                <h2 className="wd-card-title">Withdrawal Details</h2>
                <p className="wd-step-note">
                  Sending {asset.sym} over {network.label}.
                </p>
              </div>
            </div>

            <div className="wd-form">
              {/* --- Address --- */}
              <div className="wd-field">
                <label htmlFor="wd-address" className="wd-field-label">
                  Destination address
                </label>
                <input
                  id="wd-address"
                  type="text"
                  className={`wd-input ${showError && check.field === "address" ? "is-invalid" : ""}`}
                  value={address}
                  placeholder={`Enter ${network.label} address (${network.hint})`}
                  spellCheck="false"
                  autoComplete="off"
                  onChange={(e) => setAddress(e.target.value)}
                  onBlur={() => setTouched(true)}
                  aria-invalid={showError && check.field === "address"}
                />

                {usableSaved.length > 0 && (
                  <div className="wd-saved">
                    <span className="wd-muted">
                      <BookUser size={11} /> Saved
                    </span>
                    {usableSaved.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className="wd-saved-chip"
                        onClick={() => {
                          setAddress(s.address);
                          setTouched(true);
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* --- Amount --- */}
              <div className="wd-field">
                <div className="wd-field-row">
                  <label htmlFor="wd-amount" className="wd-field-label">
                    Amount
                  </label>
                  <span className="wd-muted">
                    Available {coin(asset.available)} {asset.sym}
                  </span>
                </div>

                <div
                  className={`wd-amount ${showError && check.field === "amount" ? "is-invalid" : ""}`}
                >
                  <input
                    id="wd-amount"
                    type="text"
                    inputMode="decimal"
                    value={amountText}
                    placeholder="0.00"
                    onChange={(e) => {
                      setAmountText(e.target.value);
                      setTouched(true);
                    }}
                    onBlur={() => setTouched(true)}
                    aria-invalid={showError && check.field === "amount"}
                  />
                  <span className="wd-amount-sym">{asset.sym}</span>
                  <button
                    type="button"
                    className="wd-max"
                    onClick={() => applyPercent(100)}
                  >
                    MAX
                  </button>
                </div>

                <div className="wd-percents">
                  {PERCENTS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => applyPercent(p)}
                    >
                      {p}%
                    </button>
                  ))}
                </div>
              </div>

              {/* --- Verdict --- */}
              {showError ? (
                <p className="wd-error" role="alert">
                  <XCircle size={13} /> {check.message}
                </p>
              ) : (
                Number.isFinite(amount) &&
                amount > 0 && (
                  <p className="wd-ok">
                    <CheckCircle2 size={13} /> Ready to send — arrives{" "}
                    {network.eta}.
                  </p>
                )
              )}

              {/* --- Receipt --- */}
              <dl className="wd-receipt">
                <div>
                  <dt>Amount</dt>
                  <dd>
                    {Number.isFinite(amount) ? coin(amount) : "0.00"} {asset.sym}
                  </dd>
                </div>
                <div>
                  <dt>Network fee</dt>
                  <dd className="wd-warn">
                    −{coin(network.fee)} {asset.sym}
                  </dd>
                </div>
                <div className="wd-receipt-total">
                  <dt>You will receive</dt>
                  <dd>
                    {coin(receive)} {asset.sym}
                    <small>≈ ${money(receive * asset.price)}</small>
                  </dd>
                </div>
              </dl>

              <button
                type="button"
                className="wd-submit"
                disabled={!check.ok}
              >
                <ArrowUpCircle size={15} />
                Withdraw {asset.sym}
              </button>

              <p className="wd-note">
                <Lock size={11} /> A 2FA confirmation is required before this
                transfer is broadcast.
              </p>
            </div>
          </div>

          {/* ------------------ RECENT WITHDRAWALS ------------------- */}
          <div className="wd-card">
            <h2 className="wd-card-title">Recent Withdrawals</h2>

            <div className="wd-table-scroll">
              <table className="wd-table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th className="wd-num">Amount</th>
                    <th>Network</th>
                    <th>Status</th>
                    <th className="wd-num">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {RECENT.map((row) => (
                    <tr key={row.id}>
                      <td data-label="Asset" className="wd-cell-asset">
                        <CoinMark coinKey={row.key} sym={row.sym} size="sm" />
                        <b>{row.sym}</b>
                      </td>
                      <td data-label="Amount" className="wd-num wd-strong">
                        −{coin(row.amount)}
                      </td>
                      <td data-label="Network" className="wd-muted">
                        {row.network}
                      </td>
                      <td data-label="Status">
                        <span
                          className={`wd-status is-${row.status.toLowerCase()}`}
                        >
                          {row.status === "Completed" && (
                            <CheckCircle2 size={11} />
                          )}
                          {row.status === "Pending" && <Clock size={11} />}
                          {row.status === "Rejected" && <XCircle size={11} />}
                          {row.status}
                        </span>
                      </td>
                      <td data-label="Time" className="wd-num wd-muted">
                        {row.time}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* -------------------------- SIDE RAIL ----------------------- */}
        <aside className="wd-side">
          <div className="wd-card">
            <h2 className="wd-card-title">
              <Info size={14} /> Summary
            </h2>

            <div className="wd-summary-head">
              <CoinMark coinKey={asset.key} sym={asset.sym} />
              <span className="wd-summary-text">
                <b>{asset.sym}</b>
                <small>{network.label}</small>
              </span>
            </div>

            <dl className="wd-summary">
              <div>
                <dt>Amount</dt>
                <dd>
                  {Number.isFinite(amount) ? coin(amount) : "—"} {asset.sym}
                </dd>
              </div>
              <div>
                <dt>USD value</dt>
                <dd>${money(usdValue)}</dd>
              </div>
              <div>
                <dt>Fee</dt>
                <dd>
                  {coin(network.fee)} {asset.sym}
                </dd>
              </div>
              <div>
                <dt>Receive</dt>
                <dd className="wd-up">
                  {coin(receive)} {asset.sym}
                </dd>
              </div>
              <div>
                <dt>Arrival</dt>
                <dd>{network.eta}</dd>
              </div>
            </dl>
          </div>

          <div className="wd-card">
            <h2 className="wd-card-title">
              <Gauge size={14} /> 24h Limit
            </h2>

            <div className="wd-limit">
              <div className="wd-limit-top">
                <b>${money(DAILY_USED, 0)}</b>
                <span className="wd-muted">of ${money(DAILY_LIMIT, 0)}</span>
              </div>
              <span className="wd-limit-track">
                <i
                  style={{ width: `${(DAILY_USED / DAILY_LIMIT) * 100}%` }}
                />
              </span>
              <p className="wd-limit-note">
                ${money(dailyRemaining, 0)} remaining today. Raise your limit by
                completing advanced verification.
              </p>
            </div>
          </div>

          <div className="wd-card">
            <h2 className="wd-card-title">
              <ShieldCheck size={14} /> Before You Send
            </h2>

            <ul className="wd-checklist">
              <li>
                <CheckCircle2 size={13} />
                Check the address character by character.
              </li>
              <li>
                <CheckCircle2 size={13} />
                Confirm the destination supports {network.label}.
              </li>
              <li>
                <AlertTriangle size={13} className="wd-warn" />
                Transfers are irreversible once broadcast.
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default Withdraw;
