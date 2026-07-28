import { useState } from "react";
import "./SwapModel.css";
import { FaTimes, FaExchangeAlt } from "react-icons/fa";

const SwapModel = ({ type, onClose }) => {
  const [closing, setClosing] = useState(false);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 300);
  };

  // Dynamic input fields match your design specifications perfectly
  const renderContent = () => {
    switch (type) {
      case "Swap":
        return (
          <>
            <div className="swap-box">
              <label>From</label>
              <div className="input-row">
                <select className="token-select" defaultValue="ETH">
                  <option value="ETH">ETH</option>
                  <option value="BTC">BTC</option>
                  <option value="SOL">SOL</option>
                </select>
                <input
                  type="text"
                  className="amount-input"
                  placeholder="0.00"
                />
              </div>
              <div className="balance">Balance: 12.5 ETH</div>
            </div>

            <div className="swap-switch">
              <FaExchangeAlt style={{ transform: "rotate(90deg)" }} />
            </div>

            <div className="swap-box">
              <label>To</label>
              <div className="input-row">
                <select className="token-select" defaultValue="USDC">
                  <option value="USDC">USDC</option>
                  <option value="USDT">USDT</option>
                  <option value="DAI">DAI</option>
                </select>
                <input
                  type="text"
                  className="amount-input"
                  placeholder="0.00"
                />
              </div>
              <div className="balance">Balance: 5,234.56 USDC</div>
            </div>

            <div className="swap-info">
              <div>
                <span>Rate</span>
                <strong>1 ETH = 2,456.78 USDC</strong>
              </div>
              <div>
                <span>Slippage</span>
                <strong>0.5%</strong>
              </div>
              <div>
                <span>Network Fee</span>
                <strong>~$12.34</strong>
              </div>
            </div>
          </>
        );

      case "Stake":
        return (
          <>
            <h6 className="fallback-subtitle">
              Stake your crypto & earn rewards
            </h6>
            <div className="swap-box">
              <label>Asset to Stake</label>
              <div className="input-row">
                <select className="token-select" defaultValue="ETH">
                  <option value="ETH">ETH</option>
                  <option value="SOL">SOL</option>
                </select>
                <input
                  type="text"
                  className="amount-input"
                  placeholder="0.00"
                />
              </div>
              <div className="balance">Available: 12.5 ETH</div>
            </div>
            <div className="swap-info">
              <div>
                <span>Estimated APY</span>
                <strong style={{ color: "var(--primary, #00ffb2)" }}>
                  4.2%
                </strong>
              </div>
            </div>
          </>
        );

      case "Bridge":
        return (
          <>
            <h6 className="fallback-subtitle">Transfer assets across chains</h6>
            <div className="swap-box">
              <label>From Chain</label>
              <div className="input-row">
                <select className="token-select" defaultValue="ETH">
                  <option value="ETH">Ethereum</option>
                  <option value="ARB">Arbitrum</option>
                </select>
                <input
                  type="text"
                  className="amount-input"
                  placeholder="0.00"
                />
              </div>
            </div>
          </>
        );

      case "Lend":
        return (
          <>
            <h6 className="fallback-subtitle">Lend assets & earn interest</h6>
            <div className="swap-box">
              <label>Lend Asset</label>
              <div className="input-row">
                <select className="token-select" defaultValue="USDC">
                  <option value="USDC">USDC</option>
                  <option value="USDT">USDT</option>
                </select>
                <input
                  type="text"
                  className="amount-input"
                  placeholder="0.00"
                />
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="swap-overlay" onClick={handleClose}>
      <div
        className={`swap-drawer ${closing ? "closing" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER - Preserved and fixed item alignment */}
        <div className="swap-header">
          <h5>{type === "Swap" ? "Swap Tokens" : `${type} Assets`}</h5>
          <FaTimes className="close-icon" onClick={handleClose} />
        </div>

        {/* BODY */}
        <div className="swap-body">{renderContent()}</div>

        <button className="swap-btn">{type} Now</button>
      </div>
    </div>
  );
};

export default SwapModel;
