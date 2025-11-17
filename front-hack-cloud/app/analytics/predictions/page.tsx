"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Brain,
  TrendingUp,
  MapPin,
  Clock,
  AlertTriangle,
  Shield,
  Activity,
  Calendar,
  Sparkles,
  ChevronRight,
  Info,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getAuthHeaders, getUser, isAuthenticated } from "@/lib/auth";
import { toast } from "sonner";

interface PredictionData {
  metadata: {
    analyzed_incidents: number;
    time_range_days: number;
    generated_at: string;
    ml_model_used: boolean;
    analysis_type: string;
  };
  predictions: {
    probableIncidents: Array<{
      type: string;
      probability: number;
    }>;
    hotspots: Array<{
      location: string;
      intensity: number;
    }>;
    recommendedFocus: string | null;
    source: string;
  };
  risk_zones: Array<{
    location: string;
    risk_score: number;
    risk_level: string;
    total_incidents: number;
    high_urgency_incidents: number;
    high_priority_incidents: number;
    unresolved_incidents: number;
    most_common_incident: string;
    prediction: string;
  }>;
  critical_times: {
    peak_hours: Array<{
      hour: string;
      incident_count: number;
      most_common_type: string;
      risk_level: string;
    }>;
    critical_days: Array<{
      day: string;
      incident_count: number;
      most_common_type: string;
    }>;
    recommendation: string;
  };
  recurrence_trends: {
    overall_trend: string;
    trend_percentage: number;
    avg_incidents_per_week: number;
    most_recurrent_types: Array<{
      type: string;
      count: number;
    }>;
    prediction: string;
  };
  location_predictions: Array<{
    location: string;
    predicted_types: Array<{
      type: string;
      probability: number;
      historical_count: number;
    }>;
    total_historical: number;
  }>;
  recommendations: Array<{
    priority: string;
    category: string;
    title: string;
    description: string;
    action: string;
  }>;
  insights: {
    topIncidentTypes: Array<{ type: string; count: number }>;
    topRiskZones: Array<{ location: string; count: number }>;
    peakHours: Array<{ hour: number; count: number }>;
  };
}

const RISK_LEVEL_COLORS = {
  critical: "bg-red-500/10 text-red-600 border-red-500/20",
  high: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  medium: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  low: "bg-green-500/10 text-green-600 border-green-500/20",
};

const TREND_COLORS = {
  increasing: "text-red-600 dark:text-red-400",
  decreasing: "text-green-600 dark:text-green-400",
  stable: "text-blue-600 dark:text-blue-400",
  insufficient_data: "text-gray-600 dark:text-gray-400",
};

const PRIORITY_COLORS = {
  high: "bg-red-500/10 text-red-600 border-red-500/20",
  medium: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  low: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

export default function PredictionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PredictionData | null>(null);
  const user = getUser();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/auth/login");
      return;
    }

    const userData = getUser();
    if (userData?.role !== "autoridad") {
      toast.error("Acceso denegado", {
        description: "Solo las autoridades pueden acceder a análisis predictivo",
      });
      router.push("/admin/incidents");
      return;
    }

    fetchPredictions();
  }, [router]);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "https://2dutzw4lw9.execute-api.us-east-1.amazonaws.com/analytics/predictions",
        {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            analysisType: "comprehensive",
            daysBack: 90,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        const errorText = await response.text();
        toast.error("Error al cargar predicciones", {
          description: errorText,
        });
      }
    } catch (err) {
      console.error("Error fetching predictions:", err);
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Brain className="w-12 h-12 animate-pulse mx-auto text-purple-600" />
          <p className="text-muted-foreground">
            Analizando patrones con Machine Learning...
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            No se pudieron cargar las predicciones. Intenta nuevamente.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/analytics")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Analytics
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">
                  Análisis Predictivo con IA
                </h1>
                <p className="text-sm text-muted-foreground">
                  Patrones, tendencias y predicciones basadas en {data.metadata.analyzed_incidents} incidentes
                </p>
              </div>
            </div>
          </div>
          <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">
            <Sparkles className="w-3 h-3 mr-1" />
            {data.metadata.ml_model_used ? "ML Activo" : "Análisis Heurístico"}
          </Badge>
        </div>

        {/* Info Banner */}
        <Alert className="border-purple-500/20 bg-purple-500/5">
          <Info className="w-4 h-4" />
          <AlertDescription>
            Este análisis utiliza {data.metadata.ml_model_used ? "un modelo de Machine Learning entrenado en AWS SageMaker" : "algoritmos heurísticos avanzados"} para
            identificar zonas de riesgo, horarios críticos y tendencias de recurrencia.
            Los datos se actualizan en tiempo real.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="zones" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
            <TabsTrigger value="zones">Zonas de Riesgo</TabsTrigger>
            <TabsTrigger value="times">Horarios Críticos</TabsTrigger>
            <TabsTrigger value="trends">Tendencias</TabsTrigger>
            <TabsTrigger value="predictions">Predicciones</TabsTrigger>
            <TabsTrigger value="recommendations">Recomendaciones</TabsTrigger>
          </TabsList>

          {/* Zonas de Riesgo */}
          <TabsContent value="zones" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Zonas de Alto Riesgo en el Campus
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.risk_zones.map((zone, idx) => (
                  <Card
                    key={idx}
                    className="border-l-4"
                    style={{
                      borderLeftColor:
                        zone.risk_level === "critical"
                          ? "#ef4444"
                          : zone.risk_level === "high"
                          ? "#f97316"
                          : zone.risk_level === "medium"
                          ? "#eab308"
                          : "#22c55e",
                    }}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {zone.location}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {zone.prediction}
                          </p>
                        </div>
                        <Badge
                          className={RISK_LEVEL_COLORS[zone.risk_level as keyof typeof RISK_LEVEL_COLORS]}
                        >
                          {zone.risk_level === "critical" ? "🔴 Crítico" :
                           zone.risk_level === "high" ? "🟠 Alto" :
                           zone.risk_level === "medium" ? "🟡 Medio" : "🟢 Bajo"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            Total Incidentes
                          </p>
                          <p className="text-2xl font-bold">
                            {zone.total_incidents}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            Alta Urgencia
                          </p>
                          <p className="text-2xl font-bold text-red-600">
                            {zone.high_urgency_incidents}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            Alta Prioridad
                          </p>
                          <p className="text-2xl font-bold text-orange-600">
                            {zone.high_priority_incidents}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            Sin Resolver
                          </p>
                          <p className="text-2xl font-bold text-yellow-600">
                            {zone.unresolved_incidents}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-2 text-sm">
                        <Shield className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Incidente más común:
                        </span>
                        <Badge variant="outline">
                          {zone.most_common_incident}
                        </Badge>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-muted-foreground">
                            Score de Riesgo
                          </span>
                          <span className="font-semibold">
                            {zone.risk_score}/100
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${zone.risk_score}%`,
                              backgroundColor:
                                zone.risk_level === "critical"
                                  ? "#ef4444"
                                  : zone.risk_level === "high"
                                  ? "#f97316"
                                  : zone.risk_level === "medium"
                                  ? "#eab308"
                                  : "#22c55e",
                            }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Horarios Críticos */}
          <TabsContent value="times" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Horarios Pico
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.critical_times.peak_hours.map((hour, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-semibold">{hour.hour}</p>
                        <p className="text-sm text-muted-foreground">
                          {hour.most_common_type} ({hour.incident_count}{" "}
                          incidentes)
                        </p>
                      </div>
                      <Badge
                        className={
                          hour.risk_level === "high"
                            ? RISK_LEVEL_COLORS.high
                            : RISK_LEVEL_COLORS.medium
                        }
                      >
                        {hour.risk_level === "high" ? "Alto Riesgo" : "Riesgo Medio"}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Días Críticos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.critical_times.critical_days.map((day, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-semibold">{day.day}</p>
                        <p className="text-sm text-muted-foreground">
                          {day.most_common_type}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {day.incident_count} incidentes
                      </Badge>
                    </div>
                  ))}
                  <Alert className="mt-4">
                    <Info className="w-4 h-4" />
                    <AlertDescription>
                      {data.critical_times.recommendation}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tendencias */}
          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Tendencias de Recurrencia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="border-2">
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground mb-2">
                        Tendencia General
                      </p>
                      <p
                        className={`text-2xl font-bold ${
                          TREND_COLORS[
                            data.recurrence_trends.overall_trend as keyof typeof TREND_COLORS
                          ]
                        }`}
                      >
                        {data.recurrence_trends.overall_trend === "increasing"
                          ? "📈 Aumentando"
                          : data.recurrence_trends.overall_trend === "decreasing"
                          ? "📉 Disminuyendo"
                          : data.recurrence_trends.overall_trend === "stable"
                          ? "➡️ Estable"
                          : "❓ Datos Insuficientes"}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {data.recurrence_trends.trend_percentage > 0 ? "+" : ""}
                        {data.recurrence_trends.trend_percentage.toFixed(1)}%
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-2">
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground mb-2">
                        Promedio Semanal
                      </p>
                      <p className="text-2xl font-bold">
                        {data.recurrence_trends.avg_incidents_per_week.toFixed(1)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        incidentes/semana
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-2">
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground mb-2">
                        Período Analizado
                      </p>
                      <p className="text-2xl font-bold">
                        {data.metadata.time_range_days}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">días</p>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">
                    Tipos de Incidentes Más Recurrentes
                  </h3>
                  <div className="space-y-2">
                    {data.recurrence_trends.most_recurrent_types.map(
                      (type, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <span className="font-medium">{type.type}</span>
                          <Badge variant="outline">{type.count} casos</Badge>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <Alert>
                  <Activity className="w-4 h-4" />
                  <AlertDescription>
                    {data.recurrence_trends.prediction}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Predicciones por Ubicación */}
          <TabsContent value="predictions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Predicciones por Ubicación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.location_predictions.slice(0, 10).map((location, idx) => (
                  <Card key={idx} className="border">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {location.location}
                        </h3>
                        <Badge variant="outline">
                          {location.total_historical} históricos
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        {location.predicted_types.map((type, typeIdx) => (
                          <div key={typeIdx} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span>{type.type}</span>
                              <span className="font-semibold">
                                {type.probability.toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all"
                                style={{ width: `${type.probability}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Basado en {type.historical_count} casos históricos
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recomendaciones */}
          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Recomendaciones Inteligentes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.recommendations.map((rec, idx) => (
                  <Card
                    key={idx}
                    className="border-l-4"
                    style={{
                      borderLeftColor:
                        rec.priority === "high"
                          ? "#ef4444"
                          : rec.priority === "medium"
                          ? "#eab308"
                          : "#3b82f6",
                    }}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-lg">{rec.title}</h3>
                        <Badge
                          className={
                            PRIORITY_COLORS[rec.priority as keyof typeof PRIORITY_COLORS]
                          }
                        >
                          {rec.priority === "high"
                            ? "Alta Prioridad"
                            : rec.priority === "medium"
                            ? "Media Prioridad"
                            : "Baja Prioridad"}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-3">
                        {rec.description}
                      </p>
                      <div className="flex items-center gap-2 p-3 bg-blue-500/10 rounded-lg">
                        <ChevronRight className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-600">
                          {rec.action}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Insights Rápidos */}
        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              Insights Clave
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Top 3 Tipos de Incidentes
              </p>
              <div className="space-y-1">
                {data.insights.topIncidentTypes.slice(0, 3).map((type, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{type.type}</span>
                    <Badge variant="outline">{type.count}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Top 3 Zonas de Riesgo
              </p>
              <div className="space-y-1">
                {data.insights.topRiskZones.slice(0, 3).map((zone, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="truncate">{zone.location}</span>
                    <Badge variant="outline">{zone.count}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Horas Pico</p>
              <div className="space-y-1">
                {data.insights.peakHours.slice(0, 3).map((hour, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{hour.hour}:00</span>
                    <Badge variant="outline">{hour.count}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
