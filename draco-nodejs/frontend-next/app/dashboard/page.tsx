"use client";
import { Dashboard } from "../../components/Dashboard";
import { RequireAuth } from "../../components/ProtectedRoute";

export default function Page() {
  return (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  );
}
