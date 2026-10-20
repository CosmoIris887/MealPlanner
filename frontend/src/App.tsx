import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { FoodScanner } from './pages/FoodScanner';
import { MealPlanPage } from './pages/MealPlan';
import { FoodDatabasePage } from './pages/FoodDatabase';
import { AIChat } from './pages/AIChat';
import { FoodHistoryPage } from './pages/FoodHistory';
import { ProfilePage } from './pages/Profile';

const ProtectedLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7FAFC] flex items-center justify-center text-[#64748B]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#2E8B57] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-[#243447]">Memuat AI Food Planner...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-[#F7FAFC] text-[#243447]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
};

const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Authentication Routes */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <Register />
              </PublicOnlyRoute>
            }
          />

          {/* Protected Main Application Routes */}
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/scan" element={<FoodScanner />} />
            <Route path="/meal-plan" element={<MealPlanPage />} />
            <Route path="/foods" element={<FoodDatabasePage />} />
            <Route path="/chat" element={<AIChat />} />
            <Route path="/history" element={<FoodHistoryPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
