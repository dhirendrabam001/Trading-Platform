import "./App.css";

import Dashboard from "./layout/Dashboard";
import { Route, Routes } from "react-router-dom";
import useGetCurrentUser from "./hooks/useGetCurrentUser";
import useRouteLoading from "./hooks/useRouteLoading";
import PagesLayout from "./PagesLayout/PagesLayout";
import PageLoader from "./components/PageLoader/PageLoader";

function App() {
  // Refresh -> wait on the profile call. Navigation -> a short transition.
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
      </Routes>
    </>
  );
}

export default App;
