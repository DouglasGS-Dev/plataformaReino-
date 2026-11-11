import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

const safeLazy = (importFn: () => Promise<any>) =>
  lazy(async () => {
    try {
      const res = await importFn();
      sessionStorage.removeItem('chunk_reload');
      return res;
    } catch (error) {
      console.warn('Retrying dynamic import after error:', error);
      await new Promise((resolve) => setTimeout(resolve, 300));
      try {
        return await importFn();
      } catch (retryError) {
        if (!sessionStorage.getItem('chunk_reload')) {
          sessionStorage.setItem('chunk_reload', 'true');
          window.location.reload();
        }
        throw retryError;
      }
    }
  });

// Layouts
const PublicLayout = safeLazy(() => import('./layouts/PublicLayout'));
const AdminLayout = safeLazy(() => import('./layouts/AdminLayout'));
const AppLayout = safeLazy(() => import('./layouts/AppLayout'));

// Pages
const LandingPage = safeLazy(() => import('./pages/public/LandingPage'));
const RegisterChurch = safeLazy(() => import('./pages/public/RegisterChurch'));
const AdminDashboard = safeLazy(() => import('./pages/admin/AdminDashboard'));
const Members = safeLazy(() => import('./Members'));
const AdminCells = safeLazy(() => import('./pages/admin/Cells'));
const Finance = safeLazy(() => import('./pages/admin/Finance'));
const AdminEvents = safeLazy(() => import('./pages/admin/Events'));
const AdminMinistries = safeLazy(() => import('./Ministries'));
const AdminEBD = safeLazy(() => import('./pages/admin/EBD'));
const AdminMarketplace = safeLazy(() => import('./pages/admin/Marketplace'));
const AdminSchedules = safeLazy(() => import('./Schedules'));
const AdminVisitors = safeLazy(() => import('./pages/admin/Visitors'));
const Settings = safeLazy(() => import('./components/Settings'));

// Member App Pages
const Feed = safeLazy(() => import('./pages/admin/Feed'));
const Diary = safeLazy(() => import('./pages/app/Diary'));
const Devotional = safeLazy(() => import('./pages/admin/Devotional'));
const Mentor = safeLazy(() => import('./pages/app/Mentor'));
const Timeline = safeLazy(() => import('./pages/app/Timeline'));
const Prayers = safeLazy(() => import('./pages/app/Prayers'));
const Dashboard = safeLazy(() => import('./layouts/Dashboard'));
const AppEBD = safeLazy(() => import('./pages/app/EBD'));
const AppCells = safeLazy(() => import('./pages/app/Cells'));
const AppMinistries = safeLazy(() => import('./pages/app/Ministries'));
const AppEvents = safeLazy(() => import('./pages/app/Events'));
const AppMarketplace = safeLazy(() => import('./pages/app/Marketplace'));
const AppSchedules = safeLazy(() => import('./pages/app/Schedules'));
const AppMore = safeLazy(() => import('./pages/app/More'));
const Giving = safeLazy(() => import('./pages/app/Giving'));
const Profile = safeLazy(() => import('./pages/app/Profile'));
const PlaceholderPage = safeLazy(() => import('./pages/app/PlaceholderPage'));

// Auth Pages
const ChurchLogin = safeLazy(() => import('./pages/auth/ChurchLogin'));

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
