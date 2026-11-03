import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import "sonner/dist/styles.css";
import { AuthProvider, useAuth } from "./lib/auth";
import { ThemeProvider, useTheme } from "./lib/theme";
import { WeddingProvider } from "./lib/weddingData";
import Layout from "./components/Layout";
import { Loading } from "./components/ui";
import ErrorBoundary from "./components/ErrorBoundary";

// Route Lazy Loading untuk memecah bundle menjadi chunk terpisah
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Rundown = lazy(() => import("./pages/Rundown"));
const Reception = lazy(() => import("./pages/Reception"));
const Budget = lazy(() => import("./pages/Budget"));
const Gifts = lazy(() => import("./pages/Gifts"));
const Administration = lazy(() => import("./pages/Administration"));
const Vendors = lazy(() => import("./pages/Vendors"));
const Guests = lazy(() => import("./pages/Guests"));
const Seserahan = lazy(() => import("./pages/Seserahan"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Settings = lazy(() => import("./pages/Settings"));
const Login = lazy(() => import("./pages/Login"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const NotFound = lazy(() => import("./pages/NotFound"));

function PageLoader() {
  return (
    <div className="min-h-[50vh] grid place-items-center">
      <Loading label="Memuat halaman…" />
    </div>
  );
}

/** Semua rute di bawah ini hanya untuk pengguna yang sudah masuk. */
function RequireAuth({ children }) {
  const { isAuthed, ready } = useAuth();
  const location = useLocation();

  // Tunggu pemeriksaan sesi tersimpan agar tidak "berkedip" ke halaman login.
  if (!ready) return null;

  if (!isAuthed) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

/** Pembatasan akses finansial (Anggaran & Hadiah) khusus untuk Pengantin/Pemilik. */
function RequireBudgetAccess({ children }) {
  const { canViewBudget } = useAuth();
  if (!canViewBudget) return <Navigate to="/rundown" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route
          element={
            <RequireAuth>
              <WeddingProvider>
                <Layout />
              </WeddingProvider>
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="rundown" element={<Rundown />} />
          <Route path="reception" element={<Reception />} />
          <Route
            path="budget"
            element={
              <RequireBudgetAccess>
                <Budget />
              </RequireBudgetAccess>
            }
          />
          <Route
            path="gifts"
            element={
              <RequireBudgetAccess>
                <Gifts />
              </RequireBudgetAccess>
            }
          />
          <Route path="administration" element={<Administration />} />
          <Route path="vendors" element={<Vendors />} />
          <Route path="guests" element={<Guests />} />
          <Route path="seserahan" element={<Seserahan />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

function ThemedToaster() {
  const { theme } = useTheme();
  return (
    <Toaster
      position="top-center"
      theme={theme}
      richColors
      closeButton
      mobileOffset={{ top: "16px", left: "16px", right: "16px" }}
      toastOptions={{
        className: "!font-sans !rounded-2xl !shadow-lift !border !border-line dark:!border-night-line !text-xs sm:!text-sm",
      }}
    />
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ThemedToaster />
        <AuthProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
