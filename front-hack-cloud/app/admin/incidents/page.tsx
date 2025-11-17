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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAuthHeaders, getUser, isAuthenticated } from "@/lib/auth";
import { useWebSocket } from "@/lib/websocket";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Activity,
  MapPin,
  Calendar,
  Filter,
  TrendingUp,
  Shield,
  ArrowUpCircle,
  XCircle,
  Search,
  Eye,
  Home,
  ArrowLeft,
  UserPlus,
  Users,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  assignedTo?: string;
  createdAt: number;
  updatedAt: number;
  lastNote?: string;
  significanceCount?: number;
}

interface StaffMember {
  email: string;
  fullName: string;
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

export default function AdminIncidentsPage() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<IncidentStatus | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null
  );
  const [dialogType, setDialogType] = useState<
    "status" | "priority" | "close" | "assign" | null
  >(null);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogData, setDialogData] = useState<{ value: string; note: string }>(
    {
      value: "",
      note: "",
    }
  );
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [selectedStaffEmail, setSelectedStaffEmail] = useState("");
  const user = getUser();
  const { subscribe } = useWebSocket();

  const fetchIncidents = useCallback(async () => {
    try {
      console.log("Fetching admin incidents...");
      console.log("Auth headers:", getAuthHeaders());

      const response = await fetch(
        "https://2dutzw4lw9.execute-api.us-east-1.amazonaws.com/admin/incidents",
        { headers: getAuthHeaders() }
      );

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      if (response.ok) {
        const data = await response.json();
        console.log("Admin incidents data:", data);
        console.log("Incidents array:", data.incidents);
        console.log("Incidents count:", data.incidents?.length || 0);

        setIncidents(data.incidents || []);
      } else {
        const errorText = await response.text();
        console.error("Error fetching incidents:", response.status, errorText);

        if (response.status === 401) {
          toast.error("Sesión expirada. Redirigiendo al login...");
          setTimeout(() => router.push("/auth/login"), 2000);
        } else {
          toast.error("Error al cargar incidentes", {
            description: `Error ${response.status}: ${errorText}`,
          });
        }
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Error de conexión", {
        description: "No se pudo conectar con el servidor",
      });
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchStaff = useCallback(async () => {
    try {
      console.log("Fetching staff list...");
      const response = await fetch(
        "https://2dutzw4lw9.execute-api.us-east-1.amazonaws.com/staff",
        { headers: getAuthHeaders() }
      );

      console.log("Staff response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Staff data:", data);
        setStaffList(data.staff || []);

        if (!data.staff || data.staff.length === 0) {
          console.warn("No staff members found");
          toast.info("No hay personal disponible", {
            description:
              "Asegúrate de tener usuarios con rol 'personal' registrados",
          });
        }
      } else {
        const errorText = await response.text();
        console.error("Error fetching staff:", response.status, errorText);
        toast.error("Error al cargar personal", {
          description: `Error ${response.status}`,
        });
      }
    } catch (err) {
      console.error("Error fetching staff:", err);
      toast.error("Error de conexión", {
        description: "No se pudo obtener la lista de personal",
      });
    }
  }, []);

  // Subscribe to WebSocket events
  useEffect(() => {
    const unsubscribe = subscribe((message) => {
      console.log("Admin WebSocket event received:", message);

      switch (message.type) {
        case "incident.created":
          toast.info("Nuevo incidente reportado", {
            description: `${message.data.incident.type} - ${message.data.incident.location}`,
          });
          fetchIncidents();
          break;

        case "incident.updated":
          toast.info("Incidente actualizado", {
            description: `${message.data.incident.incidentId}`,
          });
          fetchIncidents();
          break;

        case "incident.priority":
          toast.warning("Prioridad modificada", {
            description: `${message.data.incident.incidentId} - ${message.data.incident.priority}`,
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

    const userData = getUser();
    if (userData?.role === "estudiante") {
      router.push("/incidents");
      return;
    }

    fetchIncidents();
    fetchStaff();
  }, [router, fetchIncidents, fetchStaff]);

  const openDialog = (
    incident: Incident,
    type: "status" | "priority" | "close" | "assign"
  ) => {
    setSelectedIncident(incident);
    setDialogType(type);
    setDialogData({
      value:
        type === "status"
          ? incident.status
          : type === "priority"
          ? incident.priority
          : "",
      note: "",
    });
  };

  const closeDialog = () => {
    setSelectedIncident(null);
    setDialogType(null);
    setDialogData({ value: "", note: "" });
    setSelectedStaffEmail("");
  };

  const assignIncident = async (incidentId: string, staffEmail: string) => {
    try {
      setDialogLoading(true);

      console.log("Assigning incident:", incidentId, "to:", staffEmail);

      const response = await fetch(
        `https://2dutzw4lw9.execute-api.us-east-1.amazonaws.com/incidents/${incidentId}/assign`,
        {
          method: "PATCH",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ assignedTo: staffEmail }),
        }
      );

      console.log("Assignment response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const result = await response.json();
        console.log("Assignment successful:", result);
        toast.success("Incidente asignado correctamente", {
          description: `Asignado a ${staffEmail}`,
        });
        await fetchIncidents();
        closeDialog();
      } else {
        // Intentar obtener el cuerpo de la respuesta como texto primero
        const responseText = await response.text();
        console.error("Error response text:", responseText);
        
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = {
            error: responseText || `Error ${response.status}: ${response.statusText}`,
          };
        }
        
        console.error("Parsed assignment error:", errorData);
        toast.error("Error al asignar incidente", {
          description:
            errorData.error ||
            errorData.message ||
            errorData.detail ||
            `Error ${response.status}: ${response.statusText}`,
        });
      }
    } catch (err) {
      console.error("Error assigning incident:", err);
      toast.error("Error de conexión", {
        description:
          err instanceof Error
            ? err.message
            : "No se pudo conectar con el servidor",
      });
    } finally {
      setDialogLoading(false);
    }
  };

  const handleDialogSubmit = async () => {
    if (!selectedIncident) return;

    setDialogLoading(true);
    try {
      let url = `https://2dutzw4lw9.execute-api.us-east-1.amazonaws.com/incidents/${selectedIncident.incidentId}`;
      let body: any = { note: dialogData.note };

      if (dialogType === "status") {
        body.status = dialogData.value;
      } else if (dialogType === "priority") {
        url += "/priority";
        body.priority = dialogData.value;
      } else if (dialogType === "close") {
        url += "/close";
      }

      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        await fetchIncidents();
        closeDialog();
      }
    } catch (err) {
      console.error("Error updating incident:", err);
    } finally {
      setDialogLoading(false);
    }
  };

  const filteredIncidents = incidents.filter((incident) => {
    const matchesFilter = filter === "all" || incident.status === filter;
    const matchesSearch =
      searchTerm === "" ||
      incident.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.type.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: incidents.length,
    pendiente: incidents.filter((i) => i.status === "pendiente").length,
    en_atencion: incidents.filter((i) => i.status === "en_atencion").length,
    resuelto: incidents.filter((i) => i.status === "resuelto").length,
    critica: incidents.filter((i) => i.priority === "critica").length,
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
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
        <div className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-2 bg-linear-to-br from-blue-600 to-purple-600 rounded-lg sm:rounded-xl shadow-lg shrink-0">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                Panel Administrativo
              </h1>
              <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground truncate">
                Gestión de incidentes
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="default"
                size="sm"
                onClick={() => router.push("/analytics")}
                className="hidden sm:flex gap-1"
              >
                <TrendingUp className="h-4 w-4" />
                Analíticas
              </Button>
              <ThemeToggle />
            </div>
          </div>

          {/* Search Bar */}
          <Card className="border-2">
            <CardContent className="pt-4 sm:pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar incidentes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-2 sm:pb-3">
              <CardDescription className="flex items-center gap-1 sm:gap-2 text-xs">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Total</span>
                <span className="sm:hidden">Tot.</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold">
                {stats.total}
              </div>
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
                <CardHeader className="pb-2 sm:pb-3">
                  <CardDescription className="flex items-center gap-1 sm:gap-2 text-xs">
                    <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{config.label}</span>
                    <span className="sm:hidden text-[10px]">
                      {status === "pendiente"
                        ? "Pend."
                        : status === "en_atencion"
                        ? "Atenc."
                        : "Resuel."}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold">
                    {stats[status]}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow border-red-200 dark:border-red-800">
            <CardHeader className="pb-2 sm:pb-3">
              <CardDescription className="flex items-center gap-1 sm:gap-2 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Críticos</span>
                <span className="sm:hidden text-[10px]">Crít.</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400">
                {stats.critica}
              </div>
            </CardContent>
          </Card>
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
                  <p className="text-muted-foreground">
                    {searchTerm
                      ? "No se encontraron incidentes que coincidan con tu búsqueda"
                      : `No hay incidentes ${
                          filter === "all"
                            ? ""
                            : `con estado "${
                                STATUS_CONFIG[filter as IncidentStatus]?.label
                              }"`
                        }`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredIncidents.map((incident) => {
                  const statusConfig = STATUS_CONFIG[incident.status] ?? {
                    label: incident.status || "Desconocido",
                    color: "bg-gray-100 text-gray-700 border-gray-200",
                    icon: AlertCircle,
                    dotColor: "bg-gray-500",
                  };
                  const StatusIcon = statusConfig.icon;
                  const urgencyConfig =
                    incident.urgency &&
                    URGENCY_CONFIG[incident.urgency as UrgencyLevel]
                      ? URGENCY_CONFIG[incident.urgency as UrgencyLevel]
                      : {
                          label: incident.urgency || "N/A",
                          color: "bg-gray-100 text-gray-700",
                        };
                  const priorityConfig =
                    incident.priority &&
                    URGENCY_CONFIG[incident.priority as UrgencyLevel]
                      ? URGENCY_CONFIG[incident.priority as UrgencyLevel]
                      : {
                          label: incident.priority || "N/A",
                          color: "bg-gray-100 text-gray-700",
                        };

                  return (
                    <Card
                      key={incident.incidentId}
                      className="border-2 shadow-lg hover:shadow-xl transition-all"
                    >
                      <CardHeader className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                          <div className="flex-1 space-y-2 sm:space-y-3 w-full">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xl sm:text-2xl">
                                {TYPE_EMOJI[incident.type] || "📋"}
                              </span>
                              <CardTitle className="text-base sm:text-xl truncate">
                                {incident.type.charAt(0).toUpperCase() +
                                  incident.type.slice(1)}
                              </CardTitle>
                              <Badge
                                className={`${statusConfig.color} border gap-1 sm:gap-1.5 text-xs`}
                              >
                                <div
                                  className={`w-2 h-2 rounded-full ${statusConfig.dotColor} animate-pulse`}
                                />
                                <span className="hidden xs:inline">
                                  {statusConfig.label}
                                </span>
                                <span className="xs:hidden text-[10px]">
                                  {statusConfig.label.substring(0, 4)}
                                </span>
                              </Badge>
                              <Badge
                                className={`${urgencyConfig.color} text-xs`}
                              >
                                <span className="hidden xs:inline">
                                  U: {urgencyConfig.label}
                                </span>
                                <span className="xs:hidden">
                                  U:{urgencyConfig.label.charAt(0)}
                                </span>
                              </Badge>
                              <Badge
                                className={`${priorityConfig.color} text-xs`}
                              >
                                <span className="hidden xs:inline">
                                  P: {priorityConfig.label}
                                </span>
                                <span className="xs:hidden">
                                  P:{priorityConfig.label.charAt(0)}
                                </span>
                              </Badge>
                              {(incident.significanceCount ?? 0) > 0 && (
                                <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 text-xs gap-1">
                                  <span className="hidden xs:inline">
                                    🔥 {incident.significanceCount}{" "}
                                    {incident.significanceCount === 1
                                      ? "voto"
                                      : "votos"}
                                  </span>
                                  <span className="xs:hidden">
                                    🔥 {incident.significanceCount}
                                  </span>
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground flex-wrap">
                              <div className="flex items-center gap-1 sm:gap-1.5">
                                <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="truncate max-w-[120px] sm:max-w-none">
                                  {incident.location}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 sm:gap-1.5">
                                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="text-[10px] sm:text-xs">
                                  {formatDate(incident.createdAt)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 sm:gap-1.5">
                                <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="text-[10px] sm:text-xs">
                                  {incident.reporterRole}
                                </span>
                              </div>
                              {incident.assignedTo && (
                                <div className="flex items-center gap-1 sm:gap-1.5 text-blue-600 dark:text-blue-400">
                                  <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                                  <span className="text-[10px] sm:text-xs font-medium">
                                    {incident.assignedTo}
                                  </span>
                                </div>
                              )}
                            </div>

                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                              {incident.description}
                            </p>
                          </div>

                          <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm"
                              onClick={() =>
                                router.push(`/incidents/${incident.incidentId}`)
                              }
                            >
                              <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="hidden xs:inline">Ver</span>
                            </Button>

                            {user?.role === "autoridad" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm"
                                  onClick={() =>
                                    openDialog(incident, "priority")
                                  }
                                >
                                  <ArrowUpCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                  <span className="hidden xs:inline">
                                    Prioridad
                                  </span>
                                  <span className="xs:hidden text-[10px]">
                                    Prior.
                                  </span>
                                </Button>

                                {!incident.assignedTo &&
                                  incident.status !== "resuelto" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="gap-1 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm text-blue-600 border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                                      onClick={() =>
                                        openDialog(incident, "assign")
                                      }
                                    >
                                      <UserPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                                      <span className="hidden xs:inline">
                                        Asignar
                                      </span>
                                      <span className="xs:hidden text-[10px]">
                                        Asig.
                                      </span>
                                    </Button>
                                  )}
                              </>
                            )}

                            {(user?.role === "personal" ||
                              user?.role === "autoridad") &&
                              incident.status !== "resuelto" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm"
                                    onClick={() =>
                                      openDialog(incident, "status")
                                    }
                                  >
                                    <Activity className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span className="hidden xs:inline">
                                      Estado
                                    </span>
                                    <span className="xs:hidden text-[10px]">
                                      Est.
                                    </span>
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                                    onClick={() =>
                                      openDialog(incident, "close")
                                    }
                                  >
                                    <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span className="hidden xs:inline">
                                      Cerrar
                                    </span>
                                    <span className="xs:hidden text-[10px]">
                                      ✓
                                    </span>
                                  </Button>
                                </>
                              )}
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Status Update Dialog */}
      <Dialog open={dialogType === "status"} onOpenChange={() => closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Estado del Incidente</DialogTitle>
            <DialogDescription>
              Actualiza el estado del incidente y agrega una nota opcional
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nuevo Estado</Label>
              <RadioGroup
                value={dialogData.value}
                onValueChange={(value) =>
                  setDialogData({ ...dialogData, value })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pendiente" id="status-pendiente" />
                  <Label htmlFor="status-pendiente" className="cursor-pointer">
                    Pendiente
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="en_atencion" id="status-en_atencion" />
                  <Label
                    htmlFor="status-en_atencion"
                    className="cursor-pointer"
                  >
                    En Atención
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="resuelto" id="status-resuelto" />
                  <Label htmlFor="status-resuelto" className="cursor-pointer">
                    Resuelto
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Nota (Opcional)</Label>
              <Textarea
                placeholder="Agrega comentarios sobre este cambio..."
                value={dialogData.note}
                onChange={(e) =>
                  setDialogData({ ...dialogData, note: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeDialog}
              disabled={dialogLoading}
            >
              Cancelar
            </Button>
            <Button onClick={handleDialogSubmit} disabled={dialogLoading}>
              {dialogLoading ? "Actualizando..." : "Actualizar Estado"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Priority Update Dialog */}
      <Dialog
        open={dialogType === "priority"}
        onOpenChange={() => closeDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Prioridad del Incidente</DialogTitle>
            <DialogDescription>
              Ajusta la prioridad del incidente según su importancia
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nueva Prioridad</Label>
              <RadioGroup
                value={dialogData.value}
                onValueChange={(value) =>
                  setDialogData({ ...dialogData, value })
                }
              >
                {(Object.keys(URGENCY_CONFIG) as UrgencyLevel[]).map(
                  (level) => (
                    <div key={level} className="flex items-center space-x-2">
                      <RadioGroupItem value={level} id={`priority-${level}`} />
                      <Label
                        htmlFor={`priority-${level}`}
                        className="cursor-pointer"
                      >
                        {URGENCY_CONFIG[level].label}
                      </Label>
                    </div>
                  )
                )}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Nota (Opcional)</Label>
              <Textarea
                placeholder="Explica por qué cambias la prioridad..."
                value={dialogData.note}
                onChange={(e) =>
                  setDialogData({ ...dialogData, note: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeDialog}
              disabled={dialogLoading}
            >
              Cancelar
            </Button>
            <Button onClick={handleDialogSubmit} disabled={dialogLoading}>
              {dialogLoading ? "Actualizando..." : "Actualizar Prioridad"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Dialog */}
      <Dialog open={dialogType === "close"} onOpenChange={() => closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cerrar Incidente</DialogTitle>
            <DialogDescription>
              Marca este incidente como resuelto. Esta acción cambiará su estado
              a "Resuelto".
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nota de Cierre (Opcional)</Label>
              <Textarea
                placeholder="Describe cómo se resolvió el incidente..."
                value={dialogData.note}
                onChange={(e) =>
                  setDialogData({ ...dialogData, note: e.target.value })
                }
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeDialog}
              disabled={dialogLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDialogSubmit}
              disabled={dialogLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {dialogLoading ? "Cerrando..." : "Cerrar Incidente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Incident Dialog */}
      <Dialog open={dialogType === "assign"} onOpenChange={() => closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Incidente a Personal</DialogTitle>
            <DialogDescription>
              Selecciona un miembro del personal para asignarle este incidente.
              Solo usuarios con rol "personal" pueden ser asignados.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {staffList.length === 0 ? (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ No hay personal disponible para asignar.
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  Asegúrate de tener usuarios registrados con rol "personal".
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Personal Disponible ({staffList.length})</Label>
                <Select
                  value={selectedStaffEmail}
                  onValueChange={setSelectedStaffEmail}
                  disabled={dialogLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar personal..." />
                  </SelectTrigger>
                  <SelectContent>
                    {staffList.map((staff) => (
                      <SelectItem key={staff.email} value={staff.email}>
                        {staff.fullName} ({staff.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedStaffEmail && (
                  <p className="text-xs text-muted-foreground">
                    El incidente será asignado a{" "}
                    <span className="font-semibold">{selectedStaffEmail}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeDialog}
              disabled={dialogLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (selectedIncident && selectedStaffEmail) {
                  assignIncident(
                    selectedIncident.incidentId,
                    selectedStaffEmail
                  );
                } else {
                  toast.error("Selecciona un miembro del personal");
                }
              }}
              disabled={
                dialogLoading || !selectedStaffEmail || staffList.length === 0
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              {dialogLoading ? "Asignando..." : "Asignar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
