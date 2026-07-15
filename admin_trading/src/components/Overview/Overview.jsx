import { useState } from "react";
import "./Overview.css";
import OverviewTab from "../../ui/OverViewTab/OverviewTab";
import LiquidityCard from "../../ui/LiquidityCard/LiquidityCard";

const Overview = () => {
  // Navigation active tab state tracker
  const [activeTab, setActiveTab] = useState("overview");

  const navigationTabs = [
    { id: "overview", label: "Overview" },
    { id: "pools", label: "Liquidity Pools" },
    { id: "farming", label: "Yield Farming" },
    { id: "staking", label: "Staking" },
    { id: "protocols", label: "Protocols" },
  ];

  return (
    <section className="overview-main container-fluid px-0">
      {/* BOOTSTRAP CONTROL BAR ROW */}
      <div className="row align-items-center g-3 control-bar-row">
        {/* LEFT COLUMN: DYNAMIC PILL CONTAINER */}
        <div className="col-12 col-xl-8">
          <div className="nav-pill-wrapper">
            {navigationTabs.map((tab) => (
              <button
                key={tab.id}
                className={`nav-pill-item ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: UTILITY ACTION BUTTONS */}
        <div className="col-12 col-xl-4 d-flex justify-content-xl-end gap-3 actions-wrapper">
          {/* EXPORT BUTTON */}
          <button className="btn-utility btn-export">
            <svg
              className="btn-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
          </button>

          {/* ADD POSITION ACTION BUTTON */}
          <button className="btn-action-primary">
            <svg
              className="btn-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Position
          </button>
        </div>
      </div>

      {/* DYNAMIC VIEWPORT VIEWS */}
      <div className="tab-viewport-content mt-4">
        {activeTab === "overview" && <OverviewTab />}

        {activeTab === "pools" && <LiquidityCard />}

        {activeTab === "farming" && (
          <div className="tab-pane-fade animate-in">
            <p className="text-muted text-center py-5">
              Yield Farming Farming Yield Contracts Engine
            </p>
          </div>
        )}

        {activeTab === "staking" && (
          <div className="tab-pane-fade animate-in">
            <p className="text-muted text-center py-5">
              Staking Staking Vault Matrices Display Panel
            </p>
          </div>
        )}

        {activeTab === "protocols" && (
          <div className="tab-pane-fade animate-in">
            <p className="text-muted text-center py-5">
              Connected Protocol Security & Smart Allocation Logs
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Overview;
