import { Navigate } from "react-router";

import { useAuth } from "../contexts/AuthContext";
import Home from "./Home";

export default function HomeRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated && user?.role === "admin") {
    return <Navigate to="/reports" replace />;
  }

  return <Home />;
}
