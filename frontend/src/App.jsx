import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './app/store';

// Layout
import DashboardLayout from './components/DashboardLayout';

// Route Guards
import { ProtectedRoute, PublicRoute, RoleRoute } from './routes/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import PunchPage from './pages/PunchPage';
import MyAttendancePage from './pages/MyAttendancePage';
import TeamAttendancePage from './pages/TeamAttendancePage';
import AllUsersPage from './pages/AllUsersPage';
import OvertimePendingPage from './pages/OvertimePendingPage';
import ReportsPage from './pages/ReportsPage';

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#1a1d2e',
              color: '#f1f5f9',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              fontSize: '13.5px',
              fontFamily: 'Inter, system-ui, sans-serif',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />

        <Routes>
          {/* Public routes — redirect to dashboard if already logged in */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />

          {/* Protected routes — require login */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Default redirect */}
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* Dashboard home — all roles */}
            <Route path="dashboard" element={<Dashboard />} />

            {/* Punch In/Out — employee only */}
            <Route
              path="punch"
              element={
                <RoleRoute roles={['employee']}>
                  <PunchPage />
                </RoleRoute>
              }
            />

            {/* My Attendance — employee only */}
            <Route
              path="my-attendance"
              element={
                <RoleRoute roles={['employee']}>
                  <MyAttendancePage />
                </RoleRoute>
              }
            />

            {/* Team Attendance — manager & admin */}
            <Route
              path="team-attendance"
              element={
                <RoleRoute roles={['manager', 'admin']}>
                  <TeamAttendancePage />
                </RoleRoute>
              }
            />

            {/* Overtime Requests — manager & admin */}
            <Route
              path="overtime"
              element={
                <RoleRoute roles={['manager', 'admin']}>
                  <OvertimePendingPage />
                </RoleRoute>
              }
            />

            {/* Reports — all roles (filtered per role in component) */}
            <Route path="reports" element={<ReportsPage />} />

            {/* User Management — admin only */}
            <Route
              path="users"
              element={
                <RoleRoute roles={['admin']}>
                  <AllUsersPage />
                </RoleRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
