import { useState } from "react";

import "./App.css";

import Dashboard from "./layout/Dashboard";
import { Route, Routes } from "react-router-dom";
import useGetCurrentUser from "./hooks/useGetCurrentUser";

function App() {
  useGetCurrentUser();
  return (
    <Routes>
      <Route path="/" element={<Dashboard />}></Route>
      <Route path="/dashboard" element={<Dashboard />}></Route>
    </Routes>
  );
}

export default App;
