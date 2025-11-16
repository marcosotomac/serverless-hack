"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getUser, clearAuth, isAuthenticated } from "@/lib/auth";
import {
  Shield,
  LogOut,
  AlertCircle,
  Clock,
  CheckCircle,
  Plus,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/auth/login");
      return;
    }

    const userData = getUser();
    setUser(userData);
  }, [router]);

  const handleLogout = () => {
    clearAuth();
    router.push("/");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">AlertaUTEC</h1>
                <p className="text-xs text-slate-500">Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {user.fullName || user.email}
                </p>
                <p className="text-xs text-slate-500 capitalize">{user.role}</p>
              </div>
              {(user.role === "personal" || user.role === "autoridad") && (
                <Button
                  variant="outline"
                  onClick={() => router.push("/admin/incidents")}
                  className="gap-2"
                >
                  <Shield className="h-4 w-4" />
                  Panel Admin
                </Button>
              )}
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Bienvenido de vuelta, {user.fullName?.split(" ")[0] || "Usuario"}
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Este es tu panel de control de AlertaUTEC
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Mis Reportes
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-slate-500 mt-1">Reportes totales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-slate-500 mt-1">
                Pendientes de resolver
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resueltos</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-slate-500 mt-1">Reportes cerrados</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Accede a las funciones principales de la plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Button
                className="h-20 bg-blue-600 hover:bg-blue-700"
                onClick={() => router.push("/incidents/new")}
              >
                <div className="flex flex-col items-center">
                  <Plus className="h-6 w-6 mb-2" />
                  <span>Nuevo Reporte</span>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-20"
                onClick={() => router.push("/incidents")}
              >
                <div className="flex flex-col items-center">
                  <Clock className="h-6 w-6 mb-2" />
                  <span>Mis Reportes</span>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-20"
                onClick={() => router.push("/incidents")}
              >
                <div className="flex flex-col items-center">
                  <CheckCircle className="h-6 w-6 mb-2" />
                  <span>Ver Todos</span>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Empty State */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                No tienes reportes aún
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Comienza reportando tu primer incidente
              </p>
              <Button
                className="bg-blue-600 hover:bg-blue-700 gap-2"
                onClick={() => router.push("/incidents/new")}
              >
                <Plus className="h-4 w-4" />
                Crear Primer Reporte
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
