import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

// Layouts
const PublicLayout = lazy(() => import('./layouts/PublicLayout'));
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const AppLayout = lazy(() => import('./layouts/AppLayout'));

// Pages
const LandingPage = lazy(() => import('./pages/public/LandingPage'));
const RegisterChurch = lazy(() => import('./pages/public/RegisterChurch'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const Members = lazy(() => import('./Members'));
const AdminCells = lazy(() => import('./pages/admin/Cells'));
const Finance = lazy(() => import('./pages/admin/Finance'));
const AdminEvents = lazy(() => import('./pages/admin/Events'));
const AdminMinistries = lazy(() => import('./Ministries'));
const AdminEBD = lazy(() => import('./pages/admin/EBD'));
const AdminMarketplace = lazy(() => import('./pages/admin/Marketplace'));
const AdminSchedules = lazy(() => import('./Schedules'));
const AdminVisitors = lazy(() => import('./pages/admin/Visitors'));
const Settings = lazy(() => import('./components/Settings'));

// Member App Pages
const Feed = lazy(() => import('./pages/admin/Feed'));
const Diary = lazy(() => import('./pages/app/Diary'));
const Devotional = lazy(() => import('./pages/admin/Devotional'));
const Mentor = lazy(() => import('./pages/app/Mentor'));
const Timeline = lazy(() => import('./pages/app/Timeline'));
const Prayers = lazy(() => import('./pages/app/Prayers'));
const Dashboard = lazy(() => import('./layouts/Dashboard'));
const AppEBD = lazy(() => import('./pages/app/EBD'));
const AppCells = lazy(() => import('./pages/app/Cells'));
const AppMinistries = lazy(() => import('./pages/app/Ministries'));
const AppEvents = lazy(() => import('./pages/app/Events'));
const AppMarketplace = lazy(() => import('./pages/app/Marketplace'));
const AppSchedules = lazy(() => import('./pages/app/Schedules'));
const AppMore = lazy(() => import('./pages/app/More'));
const Giving = lazy(() => import('./pages/app/Giving'));
const Profile = lazy(() => import('./pages/app/Profile'));
const PlaceholderPage = lazy(() => import('./pages/app/PlaceholderPage'));

// Auth Pages
const ChurchLogin = lazy(() => import('./pages/auth/ChurchLogin'));

const LoadingFallback = () => (
  <div className="min-h-screen bg-white flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public Routes (SaaS Landing Page, Login, Register) */}
          <Route path="/" element={<LandingPage />} />
          <Route element={<PublicLayout />}>
            <Route path="/church-login" element={<ChurchLogin />} />
            <Route path="/register" element={<RegisterChurch />} />
          </Route>

          {/* Admin Routes (Church Management Panel) */}
          <Route path="/church-admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="members" element={<Members />} />
            <Route path="cells" element={<AdminCells />} />
            <Route path="ministries" element={<AdminMinistries />} />
            <Route path="finance" element={<Finance />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="ebd" element={<AdminEBD />} />
            <Route path="marketplace" element={<AdminMarketplace />} />
            <Route path="schedules" element={<AdminSchedules />} />
            <Route path="visitors" element={<AdminVisitors />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Member App Routes (The actual app for church members) */}
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Feed />} />
            <Route path="diary" element={<Diary />} />
            <Route path="devotional" element={<Devotional />} />
            <Route path="mentor" element={<Mentor />} />
            <Route path="prayers" element={<Prayers />} />
            <Route path="timeline" element={<Timeline />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="ministries" element={<AppMinistries />} />
            <Route path="cells" element={<AppCells />} />
            <Route path="events" element={<AppEvents />} />
            <Route path="ebd" element={<AppEBD />} />
            <Route path="marketplace" element={<AppMarketplace />} />
            <Route path="schedules" element={<AppSchedules />} />
            <Route path="giving" element={<Giving />} />
            <Route path="more" element={<AppMore />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
