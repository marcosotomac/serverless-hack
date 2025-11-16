"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser, isAuthenticated } from "@/lib/auth";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    const user = getUser();
    
    // Redirect based on role
    switch (user?.role) {
      case "estudiante":
        router.push("/dashboard/student");
        break;
      case "personal":
        router.push("/dashboard/staff");
        break;
      case "autoridad":
        router.push("/admin/incidents");
        break;
      default:
        router.push("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}
