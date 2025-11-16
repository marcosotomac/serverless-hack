"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isAuthenticated, getUser } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/config";
import { ThemeToggle } from "@/components/theme-toggle";
import { Download, BarChart3, TrendingUp, Users, MapPin, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface AnalyticsData {
  results: {
    incidents_by_type?: Array<{ type: string; count: number }>;
    incidents_by_status?: Array<{ status: string; count: number }>;
    incidents_by_urgency?: Array<{ urgency: string; count: number }>;
    incidents_by_location?: Array<{ location: string; count: number }>;
    incidents_by_day?: Array<{ date: string; count: number }>;
    top_reporters?: Array<{ reportedBy: string; incidents_count: number }>;
    staff_workload?: Array<{
      assignedTo: string;
      assigned_incidents: number;
      resolved: number;
      in_progress: number;
      pending: number;
    }>;
    significance_trends?: Array<{
      type: string;
      avg_significance: number;
      max_significance: number;
      total_incidents: number;
    }>;
  };
  availableQueries: string[];
  errors?: Record<string, string>;
}

const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  en_atencion: "En Atención",
  resuelto: "Resuelto",
};

const URGENCY_LABELS: Record<string, string> = {
  critica: "Crítica",
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [exportFormat, setExportFormat] = useState("pdf");

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    const user = getUser();
    if (user?.role !== "autoridad") {
      router.push("/dashboard");
      toast.error("Acceso denegado. Solo autoridades pueden ver analíticas.");
      return;
    }

    fetchAnalytics();
  }, [router]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/analytics/incidents?queries=incidents_by_type,incidents_by_status,incidents_by_urgency,incidents_by_location,incidents_by_day,top_reporters,staff_workload,significance_trends`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
        
        if (data.errors && Object.keys(data.errors).length > 0) {
          console.warn("Errores en algunos queries:", data.errors);
        }
      } else {
        toast.error("Error al cargar analíticas");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/analytics/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          format: exportFormat,
          filters: {},
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Archivo ${exportFormat.toUpperCase()} generado`);
        
        // Abrir URL de descarga
        if (data.downloadUrl) {
          window.open(data.downloadUrl, "_blank");
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Error al exportar");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al exportar");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando analíticas...</p>
        </div>
      </div>
    );
  }

  const byType = analytics?.results.incidents_by_type || [];
  const byStatus = analytics?.results.incidents_by_status || [];
  const byUrgency = analytics?.results.incidents_by_urgency || [];
  const byLocation = analytics?.results.incidents_by_location || [];
  const byDay = analytics?.results.incidents_by_day || [];
  const topReporters = analytics?.results.top_reporters || [];
  const staffWorkload = analytics?.results.staff_workload || [];
  const significanceTrends = analytics?.results.significance_trends || [];

  const totalIncidents = byStatus.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">📊 Analíticas de Incidentes</h1>
            <p className="text-muted-foreground">
              Panel de análisis y reportes para autoridades
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <ThemeToggle />
            <Button variant="outline" onClick={() => router.push("/admin/incidents")}>
              Volver al Admin
            </Button>
          </div>
        </div>

        {/* Exportación */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Exportar Reportes
            </CardTitle>
            <CardDescription>
              Descarga todos los incidentes en formato PDF, Excel o CSV
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4 items-end">
            <div className="flex-1 max-w-xs">
              <label className="text-sm font-medium mb-2 block">Formato</label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF - Reporte completo</SelectItem>
                  <SelectItem value="excel">Excel - Hoja de cálculo</SelectItem>
                  <SelectItem value="csv">CSV - Datos tabulados</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleExport} disabled={exporting}>
              {exporting ? "Generando..." : "Descargar Reporte"}
            </Button>
          </CardContent>
        </Card>

        {/* Métricas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Incidentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalIncidents}</div>
            </CardContent>
          </Card>

          {byStatus.map((item) => (
            <Card key={item.status}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {STATUS_LABELS[item.status] || item.status}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{item.count}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {((item.count / totalIncidents) * 100).toFixed(1)}% del total
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs con diferentes vistas */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="staff">Personal</TabsTrigger>
            <TabsTrigger value="trends">Tendencias</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Por Tipo */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Por Tipo de Incidente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {byType.map((item) => (
                    <div key={item.type} className="flex justify-between items-center">
                      <span className="font-medium capitalize">{item.type}</span>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Por Urgencia */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Por Urgencia
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {byUrgency.map((item) => (
                    <div key={item.urgency} className="flex justify-between items-center">
                      <span className="font-medium">
                        {URGENCY_LABELS[item.urgency] || item.urgency}
                      </span>
                      <Badge
                        variant={
                          item.urgency === "critica"
                            ? "destructive"
                            : item.urgency === "alta"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {item.count}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Por Ubicación */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Top 10 Ubicaciones
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {byLocation.map((item, idx) => (
                    <div key={item.location} className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-2">
                        <span className="text-muted-foreground">#{idx + 1}</span>
                        <span>{item.location}</span>
                      </span>
                      <Badge variant="outline">{item.count}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Top Reportadores */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Top Reportadores
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {topReporters.map((item, idx) => (
                    <div key={item.reportedBy} className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-2">
                        <span className="text-muted-foreground">#{idx + 1}</span>
                        <span className="truncate max-w-[200px]">{item.reportedBy}</span>
                      </span>
                      <Badge variant="secondary">{item.incidents_count}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="staff" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Carga de Trabajo del Personal
                </CardTitle>
                <CardDescription>
                  Distribución de incidentes asignados y estados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {staffWorkload.map((staff) => (
                    <div key={staff.assignedTo} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-semibold">{staff.assignedTo}</span>
                        <Badge>{staff.assigned_incidents} total</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Resueltos</p>
                          <p className="font-bold text-green-600">{staff.resolved}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">En Progreso</p>
                          <p className="font-bold text-blue-600">{staff.in_progress}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Pendientes</p>
                          <p className="font-bold text-yellow-600">{staff.pending}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {staffWorkload.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No hay incidentes asignados aún
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Por Día */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Últimos 30 Días
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {byDay.slice(0, 10).map((item) => (
                      <div key={item.date} className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">{item.date}</span>
                        <Badge variant="outline">{item.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Tendencias de Significancia */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Tendencias de Relevancia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {significanceTrends.map((item) => (
                      <div key={item.type} className="border-l-4 border-primary pl-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium capitalize">{item.type}</span>
                          <Badge variant="secondary">{item.total_incidents}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Promedio: {item.avg_significance.toFixed(1)} votos | Máximo:{" "}
                          {item.max_significance}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Botón para refrescar */}
        <div className="mt-8 text-center">
          <Button variant="outline" onClick={fetchAnalytics}>
            Actualizar Datos
          </Button>
        </div>
      </div>
    </div>
  );
}
