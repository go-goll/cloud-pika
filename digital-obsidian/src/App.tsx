import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { Buckets } from "./components/Buckets";
import { Transfers } from "./components/Transfers";
import { Settings } from "./components/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main Application Routes */}
        <Route path="/" element={<Layout><Dashboard /></Layout>} />
        <Route path="/buckets" element={<Layout><Buckets /></Layout>} />
        <Route path="/transfers" element={<Layout><Transfers /></Layout>} />
        <Route path="/settings" element={<Layout><Settings /></Layout>} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
