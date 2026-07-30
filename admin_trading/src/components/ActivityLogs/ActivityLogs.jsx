import {
  UserCog,
  ShieldCheck,
  PackagePlus,
  SlidersHorizontal,
  Megaphone,
} from "lucide-react";
import "./ActivityLogs.css";

const logsData = [
  {
    admin: "Admin User",
    action: "Updated User Role",
    module: "User Management",
    details: "Changed role of user John Doe to Trader",
    time: "10:24 AM",
    icon: <UserCog size={13} />,
    tone: "user",
  },
  {
    admin: "Admin User",
    action: "Approved KYC",
    module: "KYC Verification",
    details: "Approved KYC for user Alice Smith",
    time: "10:21 AM",
    icon: <ShieldCheck size={13} />,
    tone: "kyc",
  },
  {
    admin: "Admin User",
    action: "Added New Asset",
    module: "Asset Management",
    details: "Added new asset: USDC",
    time: "10:18 AM",
    icon: <PackagePlus size={13} />,
    tone: "asset",
  },
  {
    admin: "Admin User",
    action: "Updated Fees",
    module: "System Settings",
    details: "Updated trading fees for BTC/USDT",
    time: "10:15 AM",
    icon: <SlidersHorizontal size={13} />,
    tone: "settings",
  },
  {
    admin: "Admin User",
    action: "Sent Announcement",
    module: "Announcements",
    details: "System maintenance scheduled",
    time: "10:12 AM",
    icon: <Megaphone size={13} />,
    tone: "announce",
  },
];

const initials = (name) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const ActivityLogs = () => {
  return (
    <div className="row g-3 activity-logs">
      <div className="col-12">
        <section className="al-card">
          <header className="al-head">
            <h5 className="al-title">Recent Activity Logs</h5>
            <a href="#view-all" className="al-link">
              View All
            </a>
          </header>

          <table className="al-table">
            <thead>
              <tr>
                <th>Admin</th>
                <th>Action</th>
                <th>Module</th>
                <th>Details</th>
                <th className="al-right">Time</th>
              </tr>
            </thead>
            <tbody>
              {logsData.map((log, index) => (
                <tr key={index} className="al-row" style={{ "--i": index }}>
                  <td>
                    <div className="al-admin">
                      <span className="al-avatar">{initials(log.admin)}</span>
                      <span className="al-admin-name">{log.admin}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`al-action al-action--${log.tone}`}>
                      {log.icon}
                      {log.action}
                    </span>
                  </td>
                  <td>
                    <span className={`al-pill al-pill--${log.tone}`}>{log.module}</span>
                  </td>
                  <td className="al-details">{log.details}</td>
                  <td className="al-right al-time">{log.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
};

export default ActivityLogs;
