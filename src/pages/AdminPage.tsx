import { useAuth } from "@/contexts/AuthContext";
import { AdminLoginPage } from "@/components/AdminLoginPage";
import { AdminPanel } from "@/components/AdminPanel";
import { Loader2 } from "lucide-react";

export default function AdminPage() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <AdminLoginPage />;
  }

  return <AdminPanel />;
}
