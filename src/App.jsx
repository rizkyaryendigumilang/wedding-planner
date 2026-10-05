import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import { WeddingProvider } from "./lib/weddingData";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Budget from "./pages/Budget";
import Administration from "./pages/Administration";
import Vendors from "./pages/Vendors";
import Guests from "./pages/Guests";
import Seserahan from "./pages/Seserahan";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

/** Semua rute di bawah ini hanya untuk pengguna yang sudah masuk. */
function RequireAuth({ children }) {
  const { isAuthed, ready } = useAuth();
  const location = useLocation();

  // Tunggu pemeriksaan sesi tersimpan agar tidak "berkedip" ke halaman login.
  if (!ready) return null;

  if (!isAuthed) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
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
        <Route path="budget" element={<Budget />} />
        <Route path="administration" element={<Administration />} />
        <Route path="vendors" element={<Vendors />} />
        <Route path="guests" element={<Guests />} />
        <Route path="seserahan" element={<Seserahan />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
