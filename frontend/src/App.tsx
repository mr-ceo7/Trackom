/**
 * App.tsx - Router-based application root with code-split lazy loading.
 */
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Loader from './components/Loader';

// Eagerly loaded (above-the-fold)
import LandingPage from './pages/LandingPage';

// Lazy loaded pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const ApiDocsPage = lazy(() => import('./pages/ApiDocsPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));

// Product Solutions (lazy)
const SmsMarketingPage = lazy(() => import('./pages/solutions/SmsMarketingPage'));
const OtpVerificationPage = lazy(() => import('./pages/solutions/OtpVerificationPage'));
const TwoWaySmsPage = lazy(() => import('./pages/solutions/TwoWaySmsPage'));
const ResellerPage = lazy(() => import('./pages/solutions/ResellerPage'));

// Dashboard (lazy)
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout'));
const DashboardOverview = lazy(() => import('./pages/dashboard/DashboardOverview'));
const ComposeSMS = lazy(() => import('./pages/dashboard/ComposeSMS'));
const InboxPage = lazy(() => import('./pages/dashboard/InboxPage'));
const ContactsPage = lazy(() => import('./pages/dashboard/ContactsPage'));
const CampaignsPage = lazy(() => import('./pages/dashboard/CampaignsPage'));
const ReportsPage = lazy(() => import('./pages/dashboard/ReportsPage'));
const TemplatesPage = lazy(() => import('./pages/dashboard/TemplatesPage'));
const SenderIdsPage = lazy(() => import('./pages/dashboard/SenderIdsPage'));
const WalletPage = lazy(() => import('./pages/dashboard/WalletPage'));
const ApiKeysPage = lazy(() => import('./pages/dashboard/ApiKeysPage'));
const SettingsPage = lazy(() => import('./pages/dashboard/SettingsPage'));
const AdminPanelPage = lazy(() => import('./pages/dashboard/AdminPanelPage'));
const ResellerPanelPage = lazy(() => import('./pages/dashboard/ResellerPanelPage'));

/** Inline page-level loading spinner */
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F4FD] dark:bg-surface-dark">
      <Loader size="lg" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/docs" element={<ApiDocsPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* Product Solutions */}
            <Route path="/solutions/sms-marketing" element={<SmsMarketingPage />} />
            <Route path="/solutions/otp-verification" element={<OtpVerificationPage />} />
            <Route path="/solutions/two-way-sms" element={<TwoWaySmsPage />} />
            <Route path="/solutions/reseller-portal" element={<ResellerPage />} />

            {/* Protected dashboard routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardOverview />} />
              <Route path="compose" element={<ComposeSMS />} />
              <Route path="inbox" element={<InboxPage />} />
              <Route path="contacts" element={<ContactsPage />} />
              <Route path="campaigns" element={<CampaignsPage />} />
              <Route path="templates" element={<TemplatesPage />} />
              <Route path="sender-ids" element={<SenderIdsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="wallet" element={<WalletPage />} />
              <Route path="api-keys" element={<ApiKeysPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="reseller" element={<ResellerPanelPage />} />
            </Route>

            {/* Standalone Admin Console Route */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminPanelPage />
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F4FD] dark:bg-surface-dark p-6">
      <div className="text-center space-y-4">
        <div className="text-7xl font-display font-bold gradient-text">404</div>
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Page not found</h1>
        <p className="text-sm text-slate-500 dark:text-gray-400">The page you're looking for doesn't exist.</p>
        <a href="/" className="inline-flex px-6 py-3 rounded-xl text-sm font-semibold text-white bg-brand-primary hover:bg-brand-primary-hover transition-all shadow-lg shadow-brand-primary/20">Go Home</a>
      </div>
    </div>
  );
}
