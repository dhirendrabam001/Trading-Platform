import { useState } from "react";

import "./App.css";

import Dashboard from "./layout/Dashboard";
import { Route, Routes } from "react-router-dom";
import useGetCurrentUser from "./hooks/useGetCurrentUser";
import PagesLayout from "./PagesLayout/PagesLayout";

function App() {
  useGetCurrentUser();
  return (
    <Routes>
      <Route path="/" element={<Dashboard />}></Route>
      <Route path="/dashboard" element={<Dashboard />}></Route>

      {/* pages alll import */}

      <Route path="/profile" element={<PagesLayout />}></Route>
    </Routes>
  );
}

export default App;
