import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function HomeRedirect() {
  const { user, loading } = useContext(AuthContext);

  if (loading) return null; // or loader

  return user ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <Navigate to="/login" replace />
  );
}
