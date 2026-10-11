import { Routes, Route } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import PredictionPage from "./pages/PredictionPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import StudentProfilePage from "./pages/StudentProfilePage.jsx";
import AnalyticsPage from "./pages/AnalyticsPage.jsx";
import PredictionHistoryPage from "./pages/PredictionHistoryPage.jsx";

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Wait for Supabase to restore the session
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
return ( 
<Routes>
<Route path="/" element={<LandingPage />} />
<Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
<Route path="/signup" element={<PublicOnlyRoute><SignupPage /></PublicOnlyRoute>} />
<Route path="/forgot-password" element={<ForgotPasswordPage />} />
<Route path="/reset-password" element={<ResetPasswordPage />} />
<Route path="/predict" element={<PredictionPage />} /> 
<Route path="/dashboard" element={<DashboardPage />} />
<Route path="/profile" element={<StudentProfilePage />} />
<Route path="/dashboard/analytics" element={<AnalyticsPage />} />
<Route path="/dashboard/history" element={<PredictionHistoryPage />} />
</Routes>
);
}
