import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ admin = false }: { admin?: boolean }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user)
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  if (admin && user.role !== "ADMIN")
    return <Navigate to="/app/discover" replace />;
  return <Outlet />;
}
