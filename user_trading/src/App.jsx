import "./App.css";

import Dashboard from "./layout/Dashboard";
import { Route, Routes } from "react-router-dom";
import useGetCurrentUser from "./hooks/useGetCurrentUser";
import useRouteLoading from "./hooks/useRouteLoading";
import PagesLayout from "./PagesLayout/PagesLayout";
import PageLoader from "./components/PageLoader/PageLoader";

function App() {
  const bootLoading = useGetCurrentUser();
  const routeLoading = useRouteLoading();

  return (
    <>
      <PageLoader
        show={bootLoading || routeLoading}
        message={bootLoading ? "Loading your dashboard" : "Loading page"}
      />

      <Routes>
        <Route path="/" element={<Dashboard />}></Route>
        <Route path="/dashboard" element={<Dashboard />}></Route>

        {/* pages all import */}

        <Route path="/profile" element={<PagesLayout page="profile" />} />
        <Route path="/livemarket" element={<PagesLayout page="livemarket" />} />
        <Route path="/watchlist" element={<PagesLayout page="watchlist" />} />
        <Route path="/buysell" element={<PagesLayout page="buysell" />} />
        <Route
          path="/open-position"
          element={<PagesLayout page="open-position" />}
        />
        <Route
          path="/pending-order"
          element={<PagesLayout page="pending-order" />}
        />
        <Route path="/orders" element={<PagesLayout page="orders" />} />
        <Route path="/portfolio" element={<PagesLayout page="portfolio" />} />
        <Route
          path="/profit-loss"
          element={<PagesLayout page="profit-loss" />}
        />
        <Route path="/wallet" element={<PagesLayout page="wallet" />} />
        <Route path="/deposit" element={<PagesLayout page="deposit" />} />
        <Route path="/withdraw" element={<PagesLayout page="withdraw" />} />
        <Route
          path="/transactions"
          element={<PagesLayout page="transactions" />}
        />
        <Route
          path="/trade-history"
          element={<PagesLayout page="trade-history" />}
        />
        <Route
          path="/performance"
          element={<PagesLayout page="performance" />}
        />
        <Route path="/kyc" element={<PagesLayout page="kyc" />} />
        <Route
          path="/bank-accounts"
          element={<PagesLayout page="bank-accounts" />}
        />
        <Route
          path="/notifications"
          element={<PagesLayout page="notifications" />}
        />
        <Route path="/security" element={<PagesLayout page="security" />} />
        <Route path="/support" element={<PagesLayout page="support" />} />
        <Route path="/help" element={<PagesLayout page="help" />} />
      </Routes>
    </>
  );
}

export default App;
