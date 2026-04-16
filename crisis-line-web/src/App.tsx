import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { translations } from './utils/translations';
import Navigation from './components/Navigation';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Admin from './pages/Admin';
import Calendar from './pages/Calendar';
import CallSheet from './pages/CallSheet';
import EventManagement from './pages/EventManagement';
import Presencas from './pages/Presencas';
import Linhaticos from './pages/Linhaticos';

// Create a client
const queryClient = new QueryClient();

// Role-based Route component
const RoleRoute: React.FC<{ children: React.ReactNode; allowedRoles: string[] }> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="h-10 w-10 rounded-full border-[3px] border-brand-200 border-t-brand-500 animate-spin" />
        <p className="text-sm text-gray-400 font-medium">{translations.common.loading}</p>
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-white">
              <Navigation />
              <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <Suspense fallback={
                  <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                    <div className="h-10 w-10 rounded-full border-[3px] border-brand-200 border-t-brand-500 animate-spin" />
                    <p className="text-sm text-gray-400 font-medium">{translations.common.loading}</p>
                  </div>
                }>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<SignUp />} />

                    {/* Voluntário and above: Calendar, DataCollection */}
                    <Route path="/calendar" element={
                      <RoleRoute allowedRoles={['Voluntário', 'Coordenador', 'Administrador']}>
                        <Calendar />
                      </RoleRoute>
                    } />
                    <Route path="/data-collection" element={
                      <RoleRoute allowedRoles={['Voluntário', 'Coordenador', 'Administrador']}>
                        <CallSheet />
                      </RoleRoute>
                    } />

                    {/* Coordenador and above: Event Management and Presenças */}
                    <Route path="/event-management" element={
                      <RoleRoute allowedRoles={['Coordenador', 'Administrador']}>
                        <EventManagement />
                      </RoleRoute>
                    } />
                    <Route path="/presencas" element={
                      <RoleRoute allowedRoles={['Coordenador', 'Administrador']}>
                        <Presencas />
                      </RoleRoute>
                    } />

                    {/* Admin only: Linhaticos and Admin tab */}
                    <Route path="/linhaticos" element={
                      <RoleRoute allowedRoles={['Administrador']}>
                        <Linhaticos />
                      </RoleRoute>
                    } />
                    <Route path="/admin" element={
                      <RoleRoute allowedRoles={['Administrador']}>
                        <Admin />
                      </RoleRoute>
                    } />


                    {/* 404 route */}
                    <Route path="*" element={
                      <div className="flex items-center justify-center min-h-[50vh] px-4">
                        <div className="w-full max-w-md rounded-xl border border-gray-100 bg-white shadow-card p-10 text-center">
                          <p className="text-5xl font-bold text-brand-200 mb-3">404</p>
                          <p className="text-sm text-gray-600">{translations.common.pageNotFound}</p>
                        </div>
                      </div>
                    } />
                  </Routes>
                </Suspense>
              </main>
            </div>
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
