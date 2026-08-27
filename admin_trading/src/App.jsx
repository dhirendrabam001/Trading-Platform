import "./App.css";

import Dashboard from "./layout/Dashboard";
import { Route, Routes } from "react-router-dom";
import RequireAdmin from "./routes/RequireAdmin";

function App() {
  return (
    // Nothing in the console renders until the API confirms an admin session
    <RequireAdmin>
      <Routes>
        <Route path="/" element={<Dashboard />}></Route>
      </Routes>
    </RequireAdmin>
  );
}

export default App;
