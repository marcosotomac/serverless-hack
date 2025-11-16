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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuthHeaders, getUser, isAuthenticated, getToken } from "@/lib/auth";
import { useWebSocket } from "@/lib/websocket";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  MapPin,
  Plus,
  Calendar,
  User,
  Filter,
  TrendingUp,
  Activity,
  Home,
  ArrowLeft,
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
}

const STATUS_CONFIG = {
  pendiente: {
    label: "Pendiente",
    color:
      "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    icon: Clock,
    dotColor: "bg-yellow-500",
  },
  en_atencion: {
    label: "En Atención",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    icon: Activity,
    dotColor: "bg-blue-500",
  },
  resuelto: {
    label: "Resuelto",
    color:
      "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    icon: CheckCircle2,
    dotColor: "bg-green-500",
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

export default function IncidentsPage() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<IncidentStatus | "all">("all");
  const [error, setError] = useState("");
  const user = getUser();
  const { subscribe } = useWebSocket();

  const fetchIncidents = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) {
        console.error("No token found");
        setError("Sesión expirada. Por favor, inicia sesión nuevamente.");
        router.push("/auth/login");
        return;
      }

      const authHeaders = getAuthHeaders();
      console.log("Auth headers:", authHeaders);
      console.log("Token:", token.substring(0, 20) + "...");

      const response = await fetch(
        "https://2dutzw4lw9.execute-api.us-east-1.amazonaws.com/incidents",
        {
          method: "GET",
          headers: {
            ...authHeaders,
            "Content-Type": "application/json",
          },
          mode: "cors",
        }
      );

      console.log("Response status:", response.status);
      console.log(
        "Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Incidents data:", data);
        setIncidents(data.incidents || []);
      } else {
        let errorData: any = {};
        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
          errorData = await response.json().catch(() => ({}));
        } else {
          const text = await response.text();
          console.error("Error response (text):", text);
          errorData = { message: text };
        }

        console.error("Error response:", response.status, errorData);

        if (response.status === 401) {
          setError("Sesión expirada. Redirigiendo al login...");
          setTimeout(() => router.push("/auth/login"), 2000);
        } else if (response.status === 500) {
          setError(
            "Error del servidor. Posibles causas: 1) El backend no está desplegado, 2) Problemas con DynamoDB, 3) Token JWT inválido. Revisa los logs de CloudWatch."
          );
        } else {
          setError(
            errorData.message || `Error del servidor (${response.status})`
          );
        }
      }
    } catch (err) {
      console.error("Error fetching incidents:", err);
      setError(
        "Error de conexión. Verifica tu conexión a internet y que el backend esté desplegado."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Subscribe to WebSocket events
  useEffect(() => {
    const unsubscribe = subscribe((message) => {
      console.log("WebSocket event received:", message);

      switch (message.type) {
        case "incident.created":
          toast.success("Nuevo incidente reportado", {
            description: `${message.data.incident.type} - ${message.data.incident.location}`,
          });
          fetchIncidents();
          break;

        case "incident.updated":
          toast.info("Incidente actualizado", {
            description: `${message.data.incident.incidentId} - ${
              message.data.note || "Sin nota"
            }`,
          });
          fetchIncidents();
          break;

        case "incident.priority":
          toast.warning("Prioridad actualizada", {
            description: `${message.data.incident.incidentId} - Prioridad: ${message.data.incident.priority}`,
          });
          fetchIncidents();
          break;

        case "incident.closed":
          toast.success("Incidente cerrado", {
            description: `${message.data.incident.incidentId}`,
          });
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

    fetchIncidents();
  }, [router, fetchIncidents]);

  const filteredIncidents =
    filter === "all" ? incidents : incidents.filter((i) => i.status === filter);

  const stats = {
    total: incidents.length,
    pendiente: incidents.filter((i) => i.status === "pendiente").length,
    en_atencion: incidents.filter((i) => i.status === "en_atencion").length,
    resuelto: incidents.filter((i) => i.status === "resuelto").length,
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-1/4 -right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
      </div>

      <div className="container max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/dashboard")}
              title="Volver al Dashboard"
              className="shrink-0 h-9 w-9"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Mis Incidentes
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base mt-1 sm:mt-2">
                Gestiona y da seguimiento a tus reportes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />
            <Button
              onClick={() => router.push("/incidents/new")}
              className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-2 text-sm sm:text-base h-9 sm:h-10"
              size="sm"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">Nuevo Incidente</span>
              <span className="xs:hidden">Nuevo</span>
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Card className="border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 mb-8">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-red-600 dark:text-red-400">
                    Error al cargar incidentes
                  </p>
                  <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1">
                    {error}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setError("");
                    setLoading(true);
                    fetchIncidents();
                  }}
                  className="shrink-0"
                >
                  Reintentar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Total
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          {(Object.keys(STATUS_CONFIG) as IncidentStatus[]).map((status) => {
            const config = STATUS_CONFIG[status];
            const Icon = config.icon;

            return (
              <Card
                key={status}
                className="border-2 shadow-lg hover:shadow-xl transition-shadow"
              >
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {config.label}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats[status]}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filter Tabs */}
        <Tabs
          defaultValue="all"
          className="space-y-6"
          onValueChange={(v) => setFilter(v as IncidentStatus | "all")}
        >
          <Card className="border-2 shadow-lg">
            <CardContent className="pt-6">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2">
                <TabsTrigger value="all" className="gap-1 sm:gap-2">
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">Todos</span>
                  <span className="sm:hidden">All</span>
                </TabsTrigger>
                <TabsTrigger value="pendiente" className="gap-1 sm:gap-2">
                  <Clock className="w-4 h-4" />
                  <span className="hidden sm:inline">Pendientes</span>
                  <span className="sm:hidden text-xs">Pend.</span>
                </TabsTrigger>
                <TabsTrigger value="en_atencion" className="gap-1 sm:gap-2">
                  <Activity className="w-4 h-4" />
                  <span className="hidden sm:inline">En Atención</span>
                  <span className="sm:hidden text-xs">Atenc.</span>
                </TabsTrigger>
                <TabsTrigger value="resuelto" className="gap-1 sm:gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Resueltos</span>
                  <span className="sm:hidden text-xs">Resuel.</span>
                </TabsTrigger>
              </TabsList>
            </CardContent>
          </Card>

          <TabsContent value={filter} className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="border-2">
                    <CardHeader>
                      <Skeleton className="h-6 w-2/3" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredIncidents.length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="py-16 text-center">
                  <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    No hay incidentes
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {filter === "all"
                      ? "No has reportado ningún incidente aún"
                      : `No tienes incidentes con estado "${
                          STATUS_CONFIG[filter as IncidentStatus]?.label
                        }"`}
                  </p>
                  <Button
                    onClick={() => router.push("/incidents/new")}
                    variant="outline"
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Crear Primer Incidente
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredIncidents.map((incident) => {
                  const statusConfig = STATUS_CONFIG[incident.status];
                  const StatusIcon = statusConfig.icon;
                  const urgencyConfig = URGENCY_CONFIG[incident.urgency];

                  return (
                    <Card
                      key={incident.incidentId}
                      className="border-2 shadow-lg hover:shadow-xl transition-all cursor-pointer group"
                      onClick={() =>
                        router.push(`/incidents/${incident.incidentId}`)
                      }
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-2xl">
                                {TYPE_EMOJI[incident.type] || "📋"}
                              </span>
                              <CardTitle className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {incident.type.charAt(0).toUpperCase() +
                                  incident.type.slice(1)}
                              </CardTitle>
                              <Badge
                                className={`${statusConfig.color} border gap-1.5`}
                              >
                                <div
                                  className={`w-2 h-2 rounded-full ${statusConfig.dotColor} animate-pulse`}
                                />
                                {statusConfig.label}
                              </Badge>
                              <Badge className={urgencyConfig.color}>
                                {urgencyConfig.label}
                              </Badge>
                              {(incident.significanceCount ?? 0) > 0 && (
                                <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 gap-1">
                                  🔥 {incident.significanceCount}{" "}
                                  {incident.significanceCount === 1
                                    ? "voto"
                                    : "votos"}
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4" />
                                {incident.location}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                {formatDate(incident.createdAt)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <p className="text-muted-foreground line-clamp-2">
                          {incident.description}
                        </p>

                        {incident.lastNote && (
                          <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-900 border">
                            <div className="text-xs font-semibold text-muted-foreground mb-1">
                              Última nota:
                            </div>
                            <p className="text-sm">{incident.lastNote}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
