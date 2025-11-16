"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getUser,
  clearAuth,
  isAuthenticated,
  getAuthHeaders,
} from "@/lib/auth";
import { ConnectionStatus } from "@/components/connection-status";
import { ThemeToggle } from "@/components/theme-toggle";
import { useWebSocket } from "@/lib/websocket";
import { toast } from "sonner";
import {
  Shield,
  LogOut,
  AlertCircle,
  Clock,
  CheckCircle,
  Plus,
  List,
  TrendingUp,
  Activity,
  MapPin,
  Calendar,
} from "lucide-react";

type IncidentStatus = "pendiente" | "en_atencion" | "resuelto";
type UrgencyLevel = "baja" | "media" | "alta" | "critica";

interface Incident {
  incidentId: string;
  type: string;
  location: string;
  description: string;
  urgency: UrgencyLevel;
  priority: UrgencyLevel;
  status: IncidentStatus;
  reportedBy: string;
  reporterRole: string;
  createdAt: number;
  updatedAt: number;
  lastNote?: string;
}

const STATUS_CONFIG = {
  pendiente: {
    label: "Pendiente",
    color:
      "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    icon: Clock,
  },
  en_atencion: {
    label: "En Atención",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    icon: Activity,
  },
  resuelto: {
    label: "Resuelto",
    color:
      "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    icon: CheckCircle,
  },
};

const URGENCY_CONFIG = {
  baja: {
    label: "Baja",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  media: {
    label: "Media",
    color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  },
  alta: {
    label: "Alta",
    color: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  critica: {
    label: "Crítica",
    color: "bg-red-500/10 text-red-600 dark:text-red-400",
  },
};

const TYPE_EMOJI: Record<string, string> = {
  infraestructura: "🏗️",
  servicios: "🔧",
  emergencia: "🚨",
  seguridad: "🛡️",
  tecnologia: "💻",
  otros: "📋",
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const { subscribe } = useWebSocket();

  const fetchIncidents = useCallback(async () => {
    try {
      const response = await fetch(
        "https://2dutzw4lw9.execute-api.us-east-1.amazonaws.com/incidents",
        {
          headers: getAuthHeaders(),
          mode: "cors",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setIncidents(data.incidents || []);
      } else {
        console.error("Error fetching incidents");
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to WebSocket events
  useEffect(() => {
    const unsubscribe = subscribe((message) => {
      console.log("Dashboard WebSocket event received:", message);

      switch (message.type) {
        case "incident.created":
          toast.success("Nuevo incidente reportado", {
            description: `${message.data.incident.type} - ${message.data.incident.location}`,
          });
          fetchIncidents();
          break;

        case "incident.updated":
        case "incident.priority":
        case "incident.closed":
          fetchIncidents();
          break;

        default:
          console.log("Unknown event type:", message.type);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [subscribe, fetchIncidents]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/auth/login");
      return;
    }

    const userData = getUser();
    setUser(userData);
    fetchIncidents();
  }, [router, fetchIncidents]);

  const handleLogout = () => {
    clearAuth();
    router.push("/");
  };

  const stats = {
    total: incidents.length,
    pendiente: incidents.filter((i) => i.status === "pendiente").length,
    en_atencion: incidents.filter((i) => i.status === "en_atencion").length,
    resuelto: incidents.filter((i) => i.status === "resuelto").length,
  };

  const recentIncidents = incidents
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-x-hidden">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 max-w-full">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold gradient-text">
                  AlertaUTEC
                </h1>
                <p className="text-xs text-slate-500">Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[120px]">
                  {user.fullName || user.email}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user.role}</p>
              </div>
              <ThemeToggle />
              <ConnectionStatus />
              {(user.role === "personal" || user.role === "autoridad") && (
                <Button
                  variant="outline"
                  onClick={() => router.push("/admin/incidents")}
                  className="gap-1 text-xs px-2 h-8"
                  size="sm"
                >
                  <Shield className="h-3 w-3" />
                  <span className="hidden xs:inline">Panel Admin</span>
                  <span className="xs:hidden">Admin</span>
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleLogout}
                size="sm"
                className="text-xs px-2 h-8 gap-1"
              >
                <LogOut className="h-3 w-3" />
                <span className="hidden xs:inline">Cerrar Sesión</span>
                <span className="xs:hidden">Salir</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Bienvenido de vuelta, {user.fullName?.split(" ")[0] || "Usuario"}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Este es tu panel de control de AlertaUTEC
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">
                Mis Reportes
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-xl sm:text-2xl font-bold">
                    {stats.total}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Reportes totales
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">
                En Proceso
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-xl sm:text-2xl font-bold">
                    {stats.pendiente + stats.en_atencion}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Pendientes de resolver
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">
                Resueltos
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-xl sm:text-2xl font-bold">
                    {stats.resuelto}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Reportes cerrados
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-xl">
              Acciones Rápidas
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Accede a las funciones principales de la plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <Button
                className="h-16 sm:h-20 bg-blue-600 hover:bg-blue-700 text-sm sm:text-base"
                onClick={() => router.push("/incidents/new")}
              >
                <div className="flex flex-col items-center">
                  <Plus className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
                  <span>Nuevo Reporte</span>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-16 sm:h-20 text-sm sm:text-base"
                onClick={() => router.push("/incidents")}
              >
                <div className="flex flex-col items-center">
                  <List className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
                  <span>Mis Reportes</span>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-16 sm:h-20 text-sm sm:text-base"
                onClick={() => router.push("/incidents")}
              >
                <div className="flex flex-col items-center">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
                  <span>Ver Todos</span>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Incidents */}
        {loading ? (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Incidentes Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : recentIncidents.length > 0 ? (
          <Card className="mt-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl">
                Incidentes Recientes
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Tus últimos reportes de incidentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {recentIncidents.map((incident) => {
                  const statusConfig = STATUS_CONFIG[incident.status];
                  const StatusIcon = statusConfig.icon;
                  const urgencyConfig = URGENCY_CONFIG[incident.urgency];

                  return (
                    <div
                      key={incident.incidentId}
                      className="flex items-start gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() =>
                        router.push(`/incidents/${incident.incidentId}`)
                      }
                    >
                      <div className="text-xl sm:text-2xl mt-1 shrink-0">
                        {TYPE_EMOJI[incident.type] || "📋"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-xs sm:text-sm capitalize truncate">
                              {incident.type}
                            </h4>
                            <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 mt-1 truncate">
                              <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                              {incident.location}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 sm:gap-2 shrink-0">
                            <Badge
                              variant="outline"
                              className={`${statusConfig.color} text-[10px] sm:text-xs`}
                            >
                              <StatusIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                              <span className="hidden xs:inline">
                                {statusConfig.label}
                              </span>
                              <span className="xs:hidden">
                                {statusConfig.label.substring(0, 4)}
                              </span>
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`${urgencyConfig.color} text-[10px] sm:text-xs`}
                            >
                              <span className="hidden xs:inline">
                                {urgencyConfig.label}
                              </span>
                              <span className="xs:hidden">
                                {urgencyConfig.label.charAt(0)}
                              </span>
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                          {incident.description}
                        </p>
                        <div className="flex items-center gap-2 sm:gap-4 mt-2 text-[10px] sm:text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(incident.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => router.push("/incidents")}
              >
                <List className="h-4 w-4 mr-2" />
                Ver Todos los Incidentes
              </Button>
            </CardContent>
          </Card>
        ) : (
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
        )}
      </main>
    </div>
  );
}
