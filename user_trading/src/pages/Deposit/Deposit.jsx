import { useMemo, useState } from "react";
import {
  ArrowDownCircle,
  Search,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  History,
  Wallet,
  Info,
  CreditCard,
  Landmark,
} from "lucide-react";
import "./Deposit.css";

/* ================================================================== data ===
   Each asset carries its own networks, and each network its own address,
   minimum, fee and confirmation count. Everything the summary shows is read
   from the SELECTED network rather than stored separately, so the address on
   screen can never belong to a different chain than the one selected. */

const ASSETS = [
  {
    sym: "USDT",
    name: "Tether",
    key: "usdt",
    networks: [
      { id: "erc20", label: "Ethereum (ERC-20)", fee: "~$4.20", min: 10, confirmations: 12, eta: "~5 min", address: "0x7a3F92b1D4eC8845Aa10fB27c9E3d6180b4C9C21" },
      { id: "trc20", label: "Tron (TRC-20)", fee: "~$0.90", min: 5, confirmations: 20, eta: "~2 min", address: "TQn9Y2khEsLJW1ChVWFMSMeRDow5oREqjK" },
      { id: "bep20", label: "BNB Smart Chain (BEP-20)", fee: "~$0.30", min: 5, confirmations: 15, eta: "~3 min", address: "0xB4d21F7cAe5390bE28cC1e0f6D7a4b3E92C7F118" },
    ],
  },
  {
    sym: "BTC",
    name: "Bitcoin",
    key: "btc",
    networks: [
      { id: "btc", label: "Bitcoin", fee: "~$1.80", min: 0.0005, confirmations: 2, eta: "~20 min", address: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq" },
      { id: "bep20", label: "BNB Smart Chain (BEP-20)", fee: "~$0.30", min: 0.0001, confirmations: 15, eta: "~3 min", address: "0x9E12aC4b8Df6510e7B3d2A81fC0e45D7b6a1E883" },
    ],
  },
  {
    sym: "ETH",
    name: "Ethereum",
    key: "eth",
    networks: [
      { id: "erc20", label: "Ethereum (ERC-20)", fee: "~$4.20", min: 0.005, confirmations: 12, eta: "~5 min", address: "0x2F81cB9a34De7b105Ec6428fA9e0d17B54c3A6E4" },
      { id: "arbitrum", label: "Arbitrum One", fee: "~$0.15", min: 0.001, confirmations: 20, eta: "~1 min", address: "0xC71b4E2fA9d3805cB61eF7a2D45903eB8f1D2C77" },
    ],
  },
  {
    sym: "SOL",
    name: "Solana",
    key: "sol",
    networks: [
      { id: "sol", label: "Solana", fee: "~$0.01", min: 0.05, confirmations: 32, eta: "~30 sec", address: "7xKXtg2CW3T4kMxNPWTPfz4vT1nfEAPyBLpAtDhLNXon" },
    ],
  },
  {
    sym: "BNB",
    name: "BNB",
    key: "bnb",
    networks: [
      { id: "bep20", label: "BNB Smart Chain (BEP-20)", fee: "~$0.30", min: 0.01, confirmations: 15, eta: "~3 min", address: "0x5A0bE41cD9f8721eA37cB4d0e6F19c3A8b2D7E56" },
    ],
  },
  {
    sym: "XRP",
    name: "XRP",
    key: "xrp",
    networks: [
      { id: "xrp", label: "XRP Ledger", fee: "~$0.02", min: 1, confirmations: 1, eta: "~10 sec", address: "rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh", tag: "3947201" },
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
  xrp: "#5c6773",
};

const RECENT = [
  { id: "d1", sym: "USDT", key: "usdt", amount: 10000, network: "TRC-20", status: "Completed", confirmations: 20, required: 20, time: "12 Aug, 09:41" },
  { id: "d2", sym: "ETH",  key: "eth",  amount: 4.2,   network: "ERC-20", status: "Pending",   confirmations: 7,  required: 12, time: "11 Aug, 14:05" },
  { id: "d3", sym: "USDT", key: "usdt", amount: 5000,  network: "ERC-20", status: "Completed", confirmations: 12, required: 12, time: "10 Aug, 21:38" },
  { id: "d4", sym: "BTC",  key: "btc",  amount: 0.32,  network: "Bitcoin",status: "Completed", confirmations: 2,  required: 2,  time: "09 Aug, 16:12" },
  { id: "d5", sym: "SOL",  key: "sol",  amount: 120,   network: "Solana", status: "Failed",    confirmations: 0,  required: 32, time: "08 Aug, 11:47" },
];

const FIAT_METHODS = [
  { id: "card", icon: CreditCard, label: "Card Deposit", copy: "Visa / Mastercard · instant", fee: "1.8%" },
  { id: "bank", icon: Landmark, label: "Bank Transfer", copy: "SEPA / SWIFT · 1-3 days", fee: "Free" },
];

/* =============================================================== format ===*/

const money = (value, dp = 2) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });

const qtyFmt = (value) => money(value, value < 10 ? 4 : value < 1000 ? 2 : 0);

/* ============================================================ components ===*/

const CoinMark = ({ coinKey, sym, size }) => (
  <span
    className={`dp-coin${size ? ` dp-coin--${size}` : ""}`}
    style={{ backgroundColor: COIN_COLORS[coinKey] || "#6b7280" }}
    aria-hidden="true"
  >
    {sym.charAt(0)}
  </span>
);

/* --------------------------------------------------------------- QR ------
   PLACEHOLDER ONLY - this does NOT encode the address.

   It is a deterministic pattern derived from the address string, drawn so the
   layout can be designed and reviewed. Before this page is pointed at real
   deposit addresses it MUST be swapped for an actual QR encoder (qrcode,
   qrcode.react, ...), otherwise a user could scan a code that decodes to
   nothing - or worse, be trained to trust an image that carries no address.
   The address text below it is the real, authoritative value. */
const QrPlaceholder = ({ value }) => {
  const modules = 25;

  const cells = useMemo(() => {
    // Simple string hash, expanded into a stable pseudo-random bit field
    let seed = 0;
    for (let i = 0; i < value.length; i++) {
      seed = (Math.imul(seed, 31) + value.charCodeAt(i)) | 0;
    }
    const rand = () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    // The three finder squares, so the shape reads as a QR at a glance
    const inFinder = (x, y) => {
      const corners = [
        [0, 0],
        [modules - 7, 0],
        [0, modules - 7],
      ];
      return corners.some(
        ([fx, fy]) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7,
      );
    };
    const finderOn = (x, y) => {
      const corners = [
        [0, 0],
        [modules - 7, 0],
        [0, modules - 7],
      ];
      for (const [fx, fy] of corners) {
        if (x < fx || x >= fx + 7 || y < fy || y >= fy + 7) continue;
        const lx = x - fx;
        const ly = y - fy;
        const ring = Math.max(Math.abs(lx - 3), Math.abs(ly - 3));
        return ring === 3 || ring <= 1;
      }
      return false;
    };

    const out = [];
    for (let y = 0; y < modules; y++) {
      for (let x = 0; x < modules; x++) {
        const on = inFinder(x, y) ? finderOn(x, y) : rand() > 0.55;
        if (on) out.push({ x, y });
      }
    }
    return out;
  }, [value]);

  return (
    <div className="dp-qr">
      <svg
        viewBox={`0 0 ${modules} ${modules}`}
        role="img"
        aria-label="Deposit address QR placeholder"
      >
        {cells.map((c) => (
          <rect key={`${c.x}-${c.y}`} x={c.x} y={c.y} width="1" height="1" />
        ))}
      </svg>
    </div>
  );
};

/* ============================================================= component ===*/

const Deposit = () => {
  const [assetSym, setAssetSym] = useState("USDT");
  const [networkId, setNetworkId] = useState("trc20");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState("");

  const asset = useMemo(
    () => ASSETS.find((a) => a.sym === assetSym) || ASSETS[0],
    [assetSym],
  );

  /* If the previously chosen network is not offered by the new asset, fall
     back to that asset's first network rather than showing an address that
     belongs to a chain this coin does not support. */
  const network = useMemo(
    () =>
      asset.networks.find((n) => n.id === networkId) || asset.networks[0],
    [asset, networkId],
  );

  const pickAsset = (sym) => {
    const next = ASSETS.find((a) => a.sym === sym);
    setAssetSym(sym);
    if (next && !next.networks.some((n) => n.id === networkId)) {
      setNetworkId(next.networks[0].id);
    }
  };

  const copy = (label) => {
    setCopied(label);
    // Revert so the button does not stay stuck reading "Copied"
    window.setTimeout(() => setCopied(""), 1600);
  };

  const filteredAssets = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ASSETS;
    return ASSETS.filter((a) =>
      `${a.sym} ${a.name}`.toLowerCase().includes(q),
    );
  }, [query]);

  const totals = useMemo(() => {
    const completed = RECENT.filter((r) => r.status === "Completed");
    return {
      pending: RECENT.filter((r) => r.status === "Pending").length,
      completed: completed.length,
      failed: RECENT.filter((r) => r.status === "Failed").length,
    };
  }, []);

  const metrics = [
    {
      key: "total",
      icon: Wallet,
      label: "Total Deposited",
      value: "$182,450.00",
      sub: "All time",
      tone: "neutral",
    },
    {
      key: "month",
      icon: ArrowDownCircle,
      label: "This Month",
      value: "$15,000.00",
      sub: `${totals.completed} completed deposits`,
      tone: "up",
    },
    {
      key: "pending",
      icon: Clock,
      label: "Pending",
      value: String(totals.pending),
      sub: totals.pending > 0 ? "Awaiting confirmations" : "Nothing in flight",
      tone: totals.pending > 0 ? "warn" : "neutral",
    },
    {
      key: "available",
      icon: CheckCircle2,
      label: "Available Balance",
      value: "$24,562.34",
      sub: "Ready to trade",
      tone: "neutral",
    },
  ];

  return (
    <section className="dp-page">
      {/* ============================ HEADER =========================== */}
      <header className="dp-header">
        <div className="dp-heading">
          <span className="dp-heading-icon">
            <ArrowDownCircle size={19} />
          </span>
          <div>
            <h1 className="dp-title">Deposit</h1>
            <p className="dp-subtitle">
              Fund your account with crypto or fiat. Choose an asset, pick a
              network, and send to the address below.
            </p>
          </div>
        </div>

        <div className="dp-header-actions">
          <button type="button" className="dp-btn dp-btn--ghost">
            <History size={14} /> Deposit History
          </button>
        </div>
      </header>

      {/* ============================ METRICS ========================== */}
      <div className="dp-metrics">
        {metrics.map(({ key, icon: Icon, label, value, sub, tone }) => (
          <div className={`dp-card dp-metric is-${tone}`} key={key}>
            <span className="dp-metric-icon">
              <Icon size={16} />
            </span>
            <div className="dp-metric-body">
              <span className="dp-metric-label">{label}</span>
              <strong className="dp-metric-value">{value}</strong>
              <span className="dp-metric-sub">{sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ============================= GRID ============================ */}
      <div className="dp-grid">
        <div className="dp-col-main">
          {/* --------------------- STEP 1: ASSET --------------------- */}
          <div className="dp-card">
            <div className="dp-step-head">
              <span className="dp-step-num">1</span>
              <div>
                <h2 className="dp-card-title">Select Asset</h2>
                <p className="dp-step-note">
                  Choose the coin you want to deposit.
                </p>
              </div>

              <div className="dp-search">
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

            <div className="dp-asset-grid" role="radiogroup" aria-label="Asset">
              {filteredAssets.map((a) => (
                <button
                  key={a.sym}
                  type="button"
                  role="radio"
                  aria-checked={a.sym === assetSym}
                  className={`dp-asset ${a.sym === assetSym ? "is-active" : ""}`}
                  onClick={() => pickAsset(a.sym)}
                >
                  <CoinMark coinKey={a.key} sym={a.sym} />
                  <span className="dp-asset-text">
                    <b>{a.sym}</b>
                    <small>{a.name}</small>
                  </span>
                </button>
              ))}

              {filteredAssets.length === 0 && (
                <p className="dp-muted dp-no-asset">
                  No asset matches that search.
                </p>
              )}
            </div>
          </div>

          {/* -------------------- STEP 2: NETWORK -------------------- */}
          <div className="dp-card">
            <div className="dp-step-head">
              <span className="dp-step-num">2</span>
              <div>
                <h2 className="dp-card-title">Select Network</h2>
                <p className="dp-step-note">
                  The network must match the one you send from.
                </p>
              </div>
            </div>

            <div className="dp-network-list" role="radiogroup" aria-label="Network">
              {asset.networks.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  role="radio"
                  aria-checked={n.id === network.id}
                  className={`dp-network ${n.id === network.id ? "is-active" : ""}`}
                  onClick={() => setNetworkId(n.id)}
                >
                  <span className="dp-network-main">
                    <b>{n.label}</b>
                    <small>
                      Min {qtyFmt(n.min)} {asset.sym} · {n.confirmations}{" "}
                      confirmations
                    </small>
                  </span>
                  <span className="dp-network-meta">
                    <b>{n.fee}</b>
                    <small>{n.eta}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* -------------------- STEP 3: ADDRESS -------------------- */}
          <div className="dp-card">
            <div className="dp-step-head">
              <span className="dp-step-num">3</span>
              <div>
                <h2 className="dp-card-title">
                  Deposit {asset.sym} on {network.label}
                </h2>
                <p className="dp-step-note">
                  Send only {asset.sym} over this network to this address.
                </p>
              </div>
            </div>

            <div className="dp-address-body">
              <QrPlaceholder value={network.address} />

              <div className="dp-address-fields">
                <div className="dp-field">
                  <span className="dp-field-label">
                    {asset.sym} deposit address
                  </span>
                  <div className="dp-address">
                    <code>{network.address}</code>
                    <button
                      type="button"
                      className="dp-copy"
                      onClick={() => copy("address")}
                      aria-label="Copy deposit address"
                    >
                      {copied === "address" ? (
                        <CheckCircle2 size={13} />
                      ) : (
                        <Copy size={13} />
                      )}
                      {copied === "address" ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                {/* XRP and a few others need a destination tag as well as an
                    address - a deposit without it is not credited */}
                {network.tag && (
                  <div className="dp-field">
                    <span className="dp-field-label dp-warn">
                      <AlertTriangle size={11} /> Destination tag (required)
                    </span>
                    <div className="dp-address is-tag">
                      <code>{network.tag}</code>
                      <button
                        type="button"
                        className="dp-copy"
                        onClick={() => copy("tag")}
                        aria-label="Copy destination tag"
                      >
                        {copied === "tag" ? (
                          <CheckCircle2 size={13} />
                        ) : (
                          <Copy size={13} />
                        )}
                        {copied === "tag" ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                )}

                <dl className="dp-facts">
                  <div>
                    <dt>Minimum deposit</dt>
                    <dd>
                      {qtyFmt(network.min)} {asset.sym}
                    </dd>
                  </div>
                  <div>
                    <dt>Confirmations</dt>
                    <dd>{network.confirmations} blocks</dd>
                  </div>
                  <div>
                    <dt>Expected arrival</dt>
                    <dd>{network.eta}</dd>
                  </div>
                  <div>
                    <dt>Network fee</dt>
                    <dd>{network.fee}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="dp-warning">
              <AlertTriangle size={15} />
              <p>
                Sending any asset other than <b>{asset.sym}</b>, or using a
                network other than <b>{network.label}</b>, will result in
                permanent loss of funds.
              </p>
            </div>
          </div>

          {/* ------------------- RECENT DEPOSITS --------------------- */}
          <div className="dp-card">
            <h2 className="dp-card-title">Recent Deposits</h2>

            <div className="dp-table-scroll">
              <table className="dp-table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th className="dp-num">Amount</th>
                    <th>Network</th>
                    <th>Confirmations</th>
                    <th>Status</th>
                    <th className="dp-num">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {RECENT.map((row) => (
                    <tr key={row.id}>
                      <td data-label="Asset" className="dp-cell-asset">
                        <CoinMark coinKey={row.key} sym={row.sym} size="sm" />
                        <b>{row.sym}</b>
                      </td>
                      <td data-label="Amount" className="dp-num dp-strong">
                        +{qtyFmt(row.amount)}
                      </td>
                      <td data-label="Network" className="dp-muted">
                        {row.network}
                      </td>
                      <td data-label="Confirmations">
                        <span className="dp-conf">
                          <span className="dp-conf-track">
                            <i
                              style={{
                                width: `${Math.min(100, (row.confirmations / row.required) * 100)}%`,
                              }}
                            />
                          </span>
                          <small>
                            {row.confirmations}/{row.required}
                          </small>
                        </span>
                      </td>
                      <td data-label="Status">
                        <span
                          className={`dp-status is-${row.status.toLowerCase()}`}
                        >
                          {row.status === "Completed" && (
                            <CheckCircle2 size={11} />
                          )}
                          {row.status === "Pending" && <Clock size={11} />}
                          {row.status === "Failed" && (
                            <AlertTriangle size={11} />
                          )}
                          {row.status}
                        </span>
                      </td>
                      <td data-label="Time" className="dp-num dp-muted">
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
        <aside className="dp-side">
          <div className="dp-card">
            <h2 className="dp-card-title">
              <Info size={14} /> Deposit Summary
            </h2>

            <div className="dp-summary-head">
              <CoinMark coinKey={asset.key} sym={asset.sym} />
              <span className="dp-summary-text">
                <b>{asset.sym}</b>
                <small>{network.label}</small>
              </span>
            </div>

            <dl className="dp-summary">
              <div>
                <dt>Asset</dt>
                <dd>{asset.name}</dd>
              </div>
              <div>
                <dt>Network</dt>
                <dd>{network.label}</dd>
              </div>
              <div>
                <dt>Minimum</dt>
                <dd>
                  {qtyFmt(network.min)} {asset.sym}
                </dd>
              </div>
              <div>
                <dt>Confirmations</dt>
                <dd>{network.confirmations}</dd>
              </div>
              <div>
                <dt>Est. arrival</dt>
                <dd>{network.eta}</dd>
              </div>
            </dl>
          </div>

          <div className="dp-card">
            <h2 className="dp-card-title">
              <CreditCard size={14} /> Fiat Deposit
            </h2>

            <ul className="dp-fiat-list">
              {FIAT_METHODS.map(({ id, icon: Icon, label, copy: text, fee }) => (
                <li key={id}>
                  <span className="dp-fiat-icon">
                    <Icon size={15} />
                  </span>
                  <span className="dp-fiat-body">
                    <b>{label}</b>
                    <small>{text}</small>
                  </span>
                  <span className="dp-fiat-fee">{fee}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="dp-card">
            <h2 className="dp-card-title">
              <ShieldCheck size={14} /> Before You Send
            </h2>

            <ul className="dp-checklist">
              <li>
                <CheckCircle2 size={13} />
                Confirm the network matches on both sides.
              </li>
              <li>
                <CheckCircle2 size={13} />
                Send at least the minimum, or funds may not credit.
              </li>
              <li>
                <CheckCircle2 size={13} />
                Deposits appear after {network.confirmations} confirmations.
              </li>
              <li>
                <CheckCircle2 size={13} />
                This address is reusable and stays yours.
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default Deposit;
