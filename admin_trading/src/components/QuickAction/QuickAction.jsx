import { useState } from "react";
import "./QuickAction.css";
import {
  FaExchangeAlt,
  FaCoins,
  FaProjectDiagram,
  FaHandHoldingUsd,
} from "react-icons/fa";
import SwapModal from "../../ui/SwapModel";

const actions = [
  {
    title: "Swap",
    icon: <FaExchangeAlt />,
    color: "purple",
  },
  {
    title: "Stake",
    icon: <FaCoins />,
    color: "green",
  },
  {
    title: "Bridge",
    icon: <FaProjectDiagram />,
    color: "blue",
  },
  {
    title: "Lend",
    icon: <FaHandHoldingUsd />,
    color: "orange",
  },
];

const QuickAction = () => {
  const [activeModel, setActiveModel] = useState(null);
  return (
    <>
      <section className="quick-action-section mt-4">
        <h5 className="qa-title mb-4">Quick Actions</h5>
        <div className="row g-4">
          {actions.map((item, index) => (
            <div className="col-6 col-lg-6 col-md-6" key={index}>
              <div
                className={`qa-card ${item.color}`}
                onClick={() => setActiveModel(item.title)}
              >
                <div className="qa-icon">{item.icon}</div>
                <p>{item.title}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      {activeModel && (
        <SwapModal type={activeModel} onClose={() => setActiveModel(null)} />
      )}
    </>
  );
};

export default QuickAction;
