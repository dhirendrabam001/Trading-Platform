import "./DashboardCard.css";
import { FaLock, FaLayerGroup, FaPercent, FaGift } from "react-icons/fa";

const DashboardCard = () => {
  const cards = [
    {
      title: "Total Value Locked",
      value: "$847,234.56",
      sub: "Across 12 protocols",
      icon: <FaLock />,
      badge: "+12.5%",
      color: "green",
    },
    {
      title: "Active Positions",
      value: "28",
      sub: "8 Farms • 12 Pools • 8 Stakes",
      icon: <FaLayerGroup />,
      badge: "Active",
      color: "blue",
    },
    {
      title: "Average APY",
      value: "24.8%",
      sub: "Best: 156% on ETH-USDC",
      icon: <FaPercent />,
      badge: "Optimized",
      color: "green",
    },
    {
      title: "Pending Rewards",
      value: "$12,456.78",
      sub: "From 15 sources",
      icon: <FaGift />,
      badge: "Claim All",
      color: "orange",
    },
  ];

  return (
    <section className="dashboard-info">
      <div className="row g-4">
        {cards.map((card, index) => (
          <div className="col-12 col-lg-3 col-md-6" key={index}>
            <div className="dashboard-card">
              {/* TOP */}
              <div className="card-top d-flex justify-content-between">
                <div className={`icon-box ${card.color}`}>{card.icon}</div>

                <span className={`badge-custom ${card.color}`}>
                  {card.badge}
                </span>
              </div>

              {/* BODY */}
              <div className="card-body-content">
                <p className="card-title">{card.title}</p>
                <h2 className="card-value">{card.value}</h2>
                <p className="card-sub">{card.sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default DashboardCard;
