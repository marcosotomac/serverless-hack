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
import {
  getUser,
  clearAuth,
  isAuthenticated,
  getAuthHeaders,
} from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { useWebSocket } from "@/lib/websocket";
import { toast } from "sonner";
import {
  LogOut,
  Plus,
  AlertCircle,
  Clock,
  CheckCircle,
  TrendingUp,
  MessageSquare,
  ThumbsUp,
  FileText,
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
  significanceCount?: number;
  comments?: any[];
}

const STATUS_CONFIG = {
  pendiente: {
    label: "Pendiente",
    color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    icon: Clock,
  },
  en_atencion: {
    label: "En Atención",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    icon: TrendingUp,
  },
  resuelto: {
    label: "Resuelto",
    color: "bg-green-500/10 text-green-600 dark:text-green-400",
    icon: CheckCircle,
  },
};

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const { subscribe } = useWebSocket();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    const currentUser = getUser();
    if (currentUser?.role !== "estudiante") {
      router.push("/dashboard");
      return;
    }

    setUser(currentUser);
    fetchIncidents();
  }, [router]);

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
      }
    } catch (err) {
      console.error("Error fetching incidents:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribe((message) => {
      if (
        message.type === "incident.created" ||
        message.type === "incident.updated"
      ) {
        fetchIncidents();
        toast.success("Se actualizó un incidente");
      }
    });
    return () => unsubscribe();
  }, [subscribe, fetchIncidents]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Dashboard de Estudiante
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Gestiona tus incidentes reportados
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              Salir
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Incidentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-yellow-600">
                Pendientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {stats.pendiente}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-600">
                En Atención
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {stats.en_atencion}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-600">
                Resueltos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {stats.resuelto}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card
            className="border-2 border-blue-200 dark:border-blue-800 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push("/incidents/new")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <Plus className="w-5 h-5" />
                Nuevo Incidente
              </CardTitle>
              <CardDescription>
                Reporta un nuevo problema en el campus
              </CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="border-2 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push("/incidents")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Mis Incidentes
              </CardTitle>
              <CardDescription>
                Ver todos mis reportes y su estado
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Ayuda y Soporte
              </CardTitle>
              <CardDescription>¿Necesitas ayuda? Contáctanos</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Recent Incidents */}
        <Card>
          <CardHeader>
            <CardTitle>Incidentes Recientes</CardTitle>
            <CardDescription>
              Tus últimos reportes y su estado actual
            </CardDescription>
          </CardHeader>
          <CardContent>
            {incidents.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">
                  No has reportado ningún incidente aún
                </p>
                <Button onClick={() => router.push("/incidents/new")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primer Incidente
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {incidents.slice(0, 5).map((incident) => {
                  const statusConfig = STATUS_CONFIG[incident.status];
                  const StatusIcon = statusConfig.icon;

                  return (
                    <div
                      key={incident.incidentId}
                      className="p-4 rounded-lg border hover:border-blue-400 transition-colors cursor-pointer"
                      onClick={() =>
                        router.push(`/incidents/${incident.incidentId}`)
                      }
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">
                              {incident.type.charAt(0).toUpperCase() +
                                incident.type.slice(1)}
                            </h3>
                            <Badge className={statusConfig.color}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                            {(incident.significanceCount ?? 0) > 0 && (
                              <Badge variant="outline" className="gap-1">
                                <ThumbsUp className="w-3 h-3" />
                                {incident.significanceCount}
                              </Badge>
                            )}
                            {(incident.comments?.length ?? 0) > 0 && (
                              <Badge variant="outline" className="gap-1">
                                <MessageSquare className="w-3 h-3" />
                                {incident.comments?.length}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {incident.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {incident.location} •{" "}
                            {new Date(
                              incident.createdAt * 1000
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
