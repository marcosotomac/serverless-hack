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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Wrench,
  Clock,
  CheckCircle,
  Activity,
  AlertTriangle,
  MapPin,
  User,
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
  assignedTo?: string;
  createdAt: number;
  updatedAt: number;
  lastNote?: string;
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
    icon: Activity,
  },
  resuelto: {
    label: "Resuelto",
    color: "bg-green-500/10 text-green-600 dark:text-green-400",
    icon: CheckCircle,
  },
};

const URGENCY_CONFIG = {
  baja: { label: "Baja", color: "bg-gray-500/10 text-gray-600" },
  media: { label: "Media", color: "bg-yellow-500/10 text-yellow-600" },
  alta: { label: "Alta", color: "bg-orange-500/10 text-orange-600" },
  critica: { label: "Crítica", color: "bg-red-500/10 text-red-600" },
};

export default function StaffDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const { subscribe } = useWebSocket();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    const currentUser = getUser();
    if (currentUser?.role !== "personal") {
      router.push("/dashboard");
      return;
    }

    setUser(currentUser);
    fetchIncidents();
  }, [router]);

  const fetchIncidents = useCallback(async () => {
    try {
      const response = await fetch(
        "https://2dutzw4lw9.execute-api.us-east-1.amazonaws.com/admin/incidents",
        {
          headers: getAuthHeaders(),
          mode: "cors",
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Filter incidents assigned to this staff member or pending assignment
        const allIncidents = data.incidents || [];
        setIncidents(allIncidents);
      }
    } catch (err) {
      console.error("Error fetching incidents:", err);
      toast.error("Error al cargar incidentes");
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
        toast.info("Se actualizó un incidente");
      }
    });
    return () => unsubscribe();
  }, [subscribe, fetchIncidents]);

  const handleStatusChange = async (
    incidentId: string,
    newStatus: IncidentStatus
  ) => {
    setUpdatingStatus(incidentId);
    try {
      const response = await fetch(
        `https://2dutzw4lw9.execute-api.us-east-1.amazonaws.com/incidents/${incidentId}`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        toast.success("Estado actualizado correctamente");
        fetchIncidents();
      } else {
        toast.error("Error al actualizar el estado");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("Error al actualizar el estado");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleLogout = () => {
    clearAuth();
    router.push("/");
  };

  const myIncidents = incidents.filter((i) => i.assignedTo === user?.email);
  const pendingIncidents = incidents.filter(
    (i) => i.status === "pendiente" && !i.assignedTo
  );
  const inProgressIncidents = myIncidents.filter(
    (i) => i.status === "en_atencion"
  );
  const resolvedIncidents = myIncidents.filter((i) => i.status === "resuelto");

  const stats = {
    assigned: myIncidents.length,
    pending: pendingIncidents.length,
    inProgress: inProgressIncidents.length,
    resolved: resolvedIncidents.length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const IncidentCard = ({ incident }: { incident: Incident }) => {
    const statusConfig = STATUS_CONFIG[incident.status];
    const urgencyConfig = URGENCY_CONFIG[incident.urgency];
    const StatusIcon = statusConfig.icon;

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg mb-2">
                {incident.type.charAt(0).toUpperCase() + incident.type.slice(1)}
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge className={statusConfig.color}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusConfig.label}
                </Badge>
                <Badge className={urgencyConfig.color}>
                  {urgencyConfig.label}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" />
                  {incident.location}
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="w-3 h-3" />
                  Reportado por: {incident.reportedBy}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm line-clamp-2">{incident.description}</p>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/incidents/${incident.incidentId}`)}
              className="flex-1"
            >
              Ver Detalles
            </Button>

            {incident.assignedTo === user?.email && (
              <Select
                value={incident.status}
                onValueChange={(value) =>
                  handleStatusChange(
                    incident.incidentId,
                    value as IncidentStatus
                  )
                }
                disabled={updatingStatus === incident.incidentId}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="en_atencion">En Atención</SelectItem>
                  <SelectItem value="resuelto">Resuelto</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Wrench className="w-8 h-8" />
              Dashboard de Personal
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Gestiona y resuelve incidentes asignados
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
                Asignados a Mí
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.assigned}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-yellow-600">
                Sin Asignar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {stats.pending}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-600">
                En Proceso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {stats.inProgress}
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
                {stats.resolved}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="assigned" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="assigned">
              Mis Incidentes ({myIncidents.length})
            </TabsTrigger>
            <TabsTrigger value="inprogress">
              En Proceso ({inProgressIncidents.length})
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Resueltos ({resolvedIncidents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assigned" className="space-y-4">
            {myIncidents.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">
                      No tienes incidentes asignados
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myIncidents.map((incident) => (
                  <IncidentCard key={incident.incidentId} incident={incident} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="inprogress" className="space-y-4">
            {inProgressIncidents.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">
                      No hay incidentes en proceso
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inProgressIncidents.map((incident) => (
                  <IncidentCard key={incident.incidentId} incident={incident} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="resolved" className="space-y-4">
            {resolvedIncidents.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">
                      No has resuelto ningún incidente aún
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resolvedIncidents.map((incident) => (
                  <IncidentCard key={incident.incidentId} incident={incident} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
