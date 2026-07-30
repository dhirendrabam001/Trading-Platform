import "./RecentActivity.css";

const transactions = [
  {
    id: "TXN-7X9...8K2",
    user: "John Doe",
    type: "Deposit",
    asset: "USDT",
    amount: "$5,250.00",
    status: "Completed",
    time: "10:24 AM",
  },
  {
    id: "TXN-3D4...9F1",
    user: "Alice Smith",
    type: "Withdraw",
    asset: "BTC",
    amount: "0.125000",
    status: "Completed",
    time: "10:21 AM",
  },
  {
    id: "TXN-8H7...2M3",
    user: "Bob Johnson",
    type: "Deposit",
    asset: "ETH",
    amount: "2.500000",
    status: "Pending",
    time: "10:18 AM",
  },
  {
    id: "TXN-2K6...5L8",
    user: "Emma Davis",
    type: "Withdraw",
    asset: "USDT",
    amount: "$1,750.00",
    status: "Completed",
    time: "10:15 AM",
  },
  {
    id: "TXN-9P1...6N4",
    user: "Mike Wilson",
    type: "Deposit",
    asset: "BNB",
    amount: "5.000000",
    status: "Completed",
    time: "10:12 AM",
  },
];

const newUsers = [
  {
    name: "Sarah Johnson",
    email: "sarah@email.com",
    joined: "10:24 AM",
    bgColor: "#3b82f6",
    initial: "S",
  },
  {
    name: "David Brown",
    email: "david@email.com",
    joined: "10:21 AM",
    bgColor: "#8b5cf6",
    initial: "D",
  },
  {
    name: "Lisa Anderson",
    email: "lisa@email.com",
    joined: "10:18 AM",
    bgColor: "#f59e0b",
    initial: "L",
  },
  {
    name: "James Taylor",
    email: "james@email.com",
    joined: "10:15 AM",
    bgColor: "#84cc16",
    initial: "J",
  },
  {
    name: "Maria Garcia",
    email: "maria@email.com",
    joined: "10:12 AM",
    bgColor: "#f97316",
    initial: "M",
  },
];

const RecentActivity = () => {
  return (
    <div className="row g-3 recent-activity">
      {/* LEFT: Recent Transactions */}
      <div className="col-12 col-xl-7">
        <section className="ra-card">
          <header className="ra-head">
            <h5 className="ra-title">Recent Transactions</h5>
            <a href="#view-all" className="ra-link">
              View All
            </a>
          </header>

          {/* table-layout:fixed instead of a scroll container — the columns are
              sized in CSS so nothing ever overflows horizontally */}
          <table className="ra-table ra-table--txn">
            <thead>
              <tr>
                <th>TXN ID</th>
                <th>User</th>
                <th>Type</th>
                <th>Asset</th>
                <th>Amount</th>
                <th>Status</th>
                <th className="ra-right">Time</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn) => (
                <tr key={txn.id}>
                  <td className="ra-txn-id">{txn.id}</td>
                  <td className="ra-strong">{txn.user}</td>
                  <td>
                    <span
                      className={`ra-type ${
                        txn.type === "Deposit"
                          ? "ra-type--deposit"
                          : "ra-type--withdraw"
                      }`}
                    >
                      {txn.type}
                    </span>
                  </td>
                  <td className="ra-strong">{txn.asset}</td>
                  <td className="ra-strong ra-num">
                    {txn.amount}
                    {/* only surfaces on mobile, where the Asset column collapses */}
                    <span className="ra-asset-inline">{txn.asset}</span>
                  </td>
                  <td>
                    <span
                      className={`ra-pill ${
                        txn.status === "Completed"
                          ? "ra-pill--completed"
                          : "ra-pill--pending"
                      }`}
                    >
                      {txn.status}
                    </span>
                  </td>
                  <td className="ra-right ra-muted ra-num">{txn.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      {/* RIGHT: New Users */}
      <div className="col-12 col-xl-5">
        <section className="ra-card">
          <header className="ra-head">
            <h5 className="ra-title">New Users</h5>
            <a href="#view-all" className="ra-link">
              View All
            </a>
          </header>

          <table className="ra-table ra-table--users">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th className="ra-right">Joined</th>
              </tr>
            </thead>
            <tbody>
              {newUsers.map((user) => (
                <tr key={user.email}>
                  <td>
                    <div className="ra-user">
                      <span
                        className="ra-avatar"
                        style={{ backgroundColor: user.bgColor }}
                      >
                        {user.initial}
                      </span>
                      <span className="ra-user-meta">
                        <span className="ra-strong">{user.name}</span>
                        {/* only surfaces on mobile, where the Email column collapses */}
                        <span className="ra-email-inline">{user.email}</span>
                      </span>
                    </div>
                  </td>
                  <td className="ra-muted ra-email">{user.email}</td>
                  <td className="ra-right ra-muted ra-num">{user.joined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
};

export default RecentActivity;
