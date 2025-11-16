"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { getAuthHeaders, getUser } from "@/lib/auth";
import { getMediaUrls } from "@/lib/media";
import { toast } from "sonner";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  Activity,
  AlertCircle,
  FileText,
  History as HistoryIcon,
  RefreshCw,
  Image as ImageIcon,
  Video,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  ThumbsUp,
  Send,
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
  history?: HistoryEntry[];
  media?: string[];
  comments?: CommentEntry[];
  significanceCount?: number;
  significanceVoters?: string[];
}

interface CommentEntry {
  commentId: string;
  text: string;
  by: string;
  role: string;
  timestamp: number;
}

interface HistoryEntry {
  action: string;
  by: string;
  role: string;
  timestamp: number;
  newStatus?: string;
  newPriority?: string;
  note?: string;
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

const ACTION_LABELS: Record<string, string> = {
  CREATED: "Creado",
  STATUS_CHANGE: "Cambio de estado",
  PRIORITY_CHANGE: "Cambio de prioridad",
  CLOSED: "Cerrado",
  COMMENT: "Comentario agregado",
  SIGNIFICANCE_UPVOTE: "Voto de relevancia",
};

export default function IncidentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const incidentId = params.incidentId as string;
  const [incident, setIncident] = useState<Incident | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<Map<string, string>>(new Map());
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [votingSignificance, setVotingSignificance] = useState(false);
  const user = getUser();

  useEffect(() => {
    if (incidentId) {
      fetchIncident();
      fetchHistory();
    }
  }, [incidentId]);

  useEffect(() => {
    // Cargar URLs de medios cuando se carga el incidente
    if (incident?.media && incident.media.length > 0) {
      loadMediaUrls(incident.media);
    }
  }, [incident?.media]);

  const loadMediaUrls = async (mediaKeys: string[]) => {
    setLoadingMedia(true);
    try {
      const urls = await getMediaUrls(mediaKeys);
      setMediaUrls(urls);
    } catch (error) {
      console.error("Error loading media URLs:", error);
    } finally {
      setLoadingMedia(false);
    }
  };

  const fetchIncident = async () => {
    try {
      const response = await fetch(
        `https://2dutzw4lw9.execute-api.us-east-1.amazonaws.com/incidents`,
        { headers: getAuthHeaders() }
      );

      if (response.ok) {
        const data = await response.json();
        const found = data.incidents?.find(
          (i: Incident) => i.incidentId === incidentId
        );
        if (found) {
          setIncident(found);
        }
      }
    } catch (err) {
      console.error("Error fetching incident:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch(
        `https://2dutzw4lw9.execute-api.us-east-1.amazonaws.com/incidents/${incidentId}/history`,
        { headers: getAuthHeaders() }
      );

      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchIncident(), fetchHistory()]);
    setRefreshing(false);
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      toast.error("El comentario no puede estar vacío");
      return;
    }

    setSubmittingComment(true);
    try {
      const response = await fetch(
        `https://2dutzw4lw9.execute-api.us-east-1.amazonaws.com/incidents/${incidentId}/comments`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ text: commentText.trim() }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success("Comentario agregado exitosamente");
        setCommentText("");
        // Refresh incident to get updated comments
        await fetchIncident();
        await fetchHistory();
      } else {
        const error = await response.json();
        toast.error(error.message || "Error al agregar comentario");
      }
    } catch (err) {
      console.error("Error submitting comment:", err);
      toast.error("Error al agregar comentario");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleVoteSignificance = async () => {
    setVotingSignificance(true);
    try {
      const response = await fetch(
        `https://2dutzw4lw9.execute-api.us-east-1.amazonaws.com/incidents/${incidentId}/significance`,
        {
          method: "POST",
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success("Voto de relevancia registrado");
        // Refresh incident to get updated significance count
        await fetchIncident();
        await fetchHistory();
      } else {
        const error = await response.json();
        toast.error(error.message || "Error al votar");
      }
    } catch (err) {
      console.error("Error voting significance:", err);
      toast.error("Error al registrar voto");
    } finally {
      setVotingSignificance(false);
    }
  };

  const navigateMedia = (direction: "prev" | "next") => {
    if (!incident?.media || selectedMedia === null) return;

    if (direction === "prev") {
      setSelectedMedia(
        (selectedMedia - 1 + incident.media.length) % incident.media.length
      );
    } else {
      setSelectedMedia((selectedMedia + 1) % incident.media.length);
    }
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

  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp * 1000;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `hace ${days} día${days > 1 ? "s" : ""}`;
    if (hours > 0) return `hace ${hours} hora${hours > 1 ? "s" : ""}`;
    if (minutes > 0) return `hace ${minutes} minuto${minutes > 1 ? "s" : ""}`;
    return "hace un momento";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="container max-w-5xl mx-auto px-4 py-8">
          <Skeleton className="h-12 w-48 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="container max-w-5xl mx-auto px-4 py-8">
          <Card className="border-2">
            <CardContent className="py-16 text-center">
              <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                Incidente no encontrado
              </h3>
              <p className="text-muted-foreground mb-6">
                El incidente que buscas no existe o no tienes acceso a él
              </p>
              <Button
                onClick={() => router.push("/incidents")}
                variant="outline"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Incidentes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[incident.status] ?? {
    label: incident.status || "Desconocido",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: AlertCircle,
    dotColor: "bg-gray-500",
  };
  const StatusIcon = statusConfig.icon;
  const urgencyConfig = URGENCY_CONFIG[incident.urgency] ?? {
    label: incident.urgency || "N/A",
    color: "bg-gray-100 text-gray-700",
  };
  const priorityConfig = URGENCY_CONFIG[incident.priority] ?? {
    label: incident.priority || "N/A",
    color: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-1/4 -right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
      </div>

      <div className="container max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/incidents")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>

          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Actualizar
          </Button>
        </div>

        <Tabs defaultValue="details" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details" className="gap-2">
              <FileText className="w-4 h-4" />
              Detalles
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <HistoryIcon className="w-4 h-4" />
              Historial ({history.length})
            </TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6">
            {/* Main Info Card */}
            <Card className="border-2 shadow-lg">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <span className="text-4xl">
                    {TYPE_EMOJI[incident.type] || "📋"}
                  </span>
                  <div className="flex-1 space-y-3">
                    <div>
                      <CardTitle className="text-2xl mb-2">
                        {incident.type.charAt(0).toUpperCase() +
                          incident.type.slice(1)}
                      </CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          className={`${statusConfig.color} border gap-1.5`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full ${statusConfig.dotColor} animate-pulse`}
                          />
                          {statusConfig.label}
                        </Badge>
                        <Badge className={urgencyConfig.color}>
                          Urgencia: {urgencyConfig.label}
                        </Badge>
                        <Badge className={priorityConfig.color}>
                          Prioridad: {priorityConfig.label}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{incident.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(incident.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="w-4 h-4" />
                        <span>Reportado por: {incident.reporterRole}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{formatRelativeTime(incident.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Description Card */}
            <Card className="border-2 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">
                  Descripción del Incidente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {incident.description}
                </p>
              </CardContent>
            </Card>

            {/* Media Gallery Card */}
            {incident.media && incident.media.length > 0 && (
              <Card className="border-2 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-purple-600" />
                    Archivos Multimedia ({incident.media.length})
                  </CardTitle>
                  <CardDescription>
                    Fotos y videos adjuntos al incidente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingMedia ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-muted-foreground">
                        Cargando multimedia...
                      </span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {incident.media.map((mediaKey, index) => {
                        const url = mediaUrls.get(mediaKey);
                        const isVideo =
                          mediaKey.includes(".mp4") ||
                          mediaKey.includes(".mov") ||
                          mediaKey.includes(".mkv") ||
                          mediaKey.includes("video/");

                        return (
                          <div
                            key={index}
                            onClick={() =>
                              !isVideo && url && setSelectedMedia(index)
                            }
                            className={`relative group rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-600 transition-colors ${
                              !isVideo && url ? "cursor-pointer" : ""
                            }`}
                          >
                            <div className="aspect-square relative bg-slate-200 dark:bg-slate-800">
                              {url ? (
                                isVideo ? (
                                  <video
                                    src={url}
                                    controls
                                    className="w-full h-full object-cover"
                                  >
                                    Tu navegador no soporta videos.
                                  </video>
                                ) : (
                                  <img
                                    src={url}
                                    alt={`Imagen ${index + 1}`}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                )
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  {isVideo ? (
                                    <Video className="w-12 h-12 text-slate-400" />
                                  ) : (
                                    <ImageIcon className="w-12 h-12 text-slate-400" />
                                  )}
                                </div>
                              )}

                              {/* Type Badge */}
                              <div className="absolute top-2 right-2">
                                <Badge
                                  className={
                                    isVideo ? "bg-purple-500" : "bg-blue-500"
                                  }
                                >
                                  {isVideo ? (
                                    <>
                                      <Video className="w-3 h-3 mr-1" />
                                      Video
                                    </>
                                  ) : (
                                    <>
                                      <ImageIcon className="w-3 h-3 mr-1" />
                                      Imagen
                                    </>
                                  )}
                                </Badge>
                              </div>
                            </div>

                            {/* File name */}
                            <div className="p-2 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
                              <p className="text-xs truncate text-muted-foreground">
                                {mediaKey.split("/").pop() ||
                                  `Archivo ${index + 1}`}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Last Note Card */}
            {incident.lastNote && (
              <Card className="border-2 shadow-lg border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Última Nota
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {incident.lastNote}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Significance Voting Card */}
            <Card className="border-2 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ThumbsUp className="w-5 h-5 text-purple-600" />
                      Relevancia del Incidente
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Marca este incidente como importante para priorizar su atención
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {incident.significanceCount || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {(incident.significanceCount || 0) === 1 ? "voto" : "votos"}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleVoteSignificance}
                  disabled={
                    votingSignificance ||
                    (incident.significanceVoters?.includes(user?.email || "") ?? false)
                  }
                  className="w-full gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
                >
                  {votingSignificance ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Registrando...
                    </>
                  ) : incident.significanceVoters?.includes(user?.email || "") ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Ya votaste
                    </>
                  ) : (
                    <>
                      <ThumbsUp className="w-4 h-4" />
                      Marcar como Importante
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card className="border-2 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  Comentarios ({incident.comments?.length || 0})
                </CardTitle>
                <CardDescription>
                  Agrega contexto o actualizaciones sobre este incidente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Comment Input */}
                {user?.role === "estudiante" && (
                  <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                    <Textarea
                      placeholder="Escribe tu comentario aquí..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="min-h-[100px] resize-none"
                      maxLength={500}
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {commentText.length}/500 caracteres
                      </p>
                      <Button
                        onClick={handleSubmitComment}
                        disabled={!commentText.trim() || submittingComment}
                        className="gap-2"
                      >
                        {submittingComment ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Enviar Comentario
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Comments List */}
                {incident.comments && incident.comments.length > 0 ? (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {incident.comments
                        .sort((a, b) => b.timestamp - a.timestamp)
                        .map((comment) => (
                          <div
                            key={comment.commentId}
                            className="p-4 rounded-lg border bg-white dark:bg-slate-950"
                          >
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                                  {comment.by.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-medium text-sm">
                                    {comment.by}
                                  </p>
                                  <p className="text-xs text-muted-foreground capitalize">
                                    {comment.role}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(comment.timestamp)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatRelativeTime(comment.timestamp)}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm text-foreground leading-relaxed">
                              {comment.text}
                            </p>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No hay comentarios aún</p>
                    {user?.role === "estudiante" && (
                      <p className="text-sm mt-1">¡Sé el primero en comentar!</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ID Card */}
            <Card className="border-2 border-dashed">
              <CardContent className="pt-6">
                <div className="text-xs text-muted-foreground">
                  ID del Incidente
                </div>
                <code className="text-sm font-mono bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded mt-1 inline-block">
                  {incident.incidentId}
                </code>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card className="border-2 shadow-lg">
              <CardHeader>
                <CardTitle>Historial de Cambios</CardTitle>
                <CardDescription>
                  Registro cronológico de todas las acciones realizadas en este
                  incidente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  {history.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <HistoryIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No hay historial disponible</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {history.map((entry, index) => (
                        <div
                          key={index}
                          className="relative pl-8 pb-8 last:pb-0"
                        >
                          {/* Timeline line */}
                          {index !== history.length - 1 && (
                            <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800" />
                          )}

                          {/* Timeline dot */}
                          <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-blue-500 border-4 border-background shadow-md" />

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge
                                variant="outline"
                                className="font-semibold"
                              >
                                {ACTION_LABELS[entry.action] || entry.action}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(entry.timestamp)}
                              </span>
                            </div>

                            <div className="text-sm text-muted-foreground">
                              Por:{" "}
                              <span className="font-medium text-foreground">
                                {entry.role}
                              </span>
                            </div>

                            {entry.newStatus && (
                              <div className="text-sm">
                                Nuevo estado:{" "}
                                <Badge
                                  className={
                                    STATUS_CONFIG[
                                      entry.newStatus as IncidentStatus
                                    ]?.color
                                  }
                                >
                                  {
                                    STATUS_CONFIG[
                                      entry.newStatus as IncidentStatus
                                    ]?.label
                                  }
                                </Badge>
                              </div>
                            )}

                            {entry.newPriority && (
                              <div className="text-sm">
                                Nueva prioridad:{" "}
                                <Badge
                                  className={
                                    URGENCY_CONFIG[
                                      entry.newPriority as UrgencyLevel
                                    ]?.color
                                  }
                                >
                                  {
                                    URGENCY_CONFIG[
                                      entry.newPriority as UrgencyLevel
                                    ]?.label
                                  }
                                </Badge>
                              </div>
                            )}

                            {entry.note && (
                              <div className="mt-2 p-3 rounded-lg bg-slate-100 dark:bg-slate-900 border text-sm">
                                {entry.note}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Media Lightbox Dialog */}
      <Dialog
        open={selectedMedia !== null}
        onOpenChange={(open) => !open && setSelectedMedia(null)}
      >
        <DialogContent className="max-w-4xl w-full p-0">
          {selectedMedia !== null && incident?.media && (
            <div className="relative">
              {/* Header */}
              <DialogHeader className="absolute top-0 left-0 right-0 z-10 bg-black/50 backdrop-blur-sm p-4">
                <DialogTitle className="text-white">
                  Imagen {selectedMedia + 1} de {incident.media.length}
                </DialogTitle>
              </DialogHeader>

              {/* Image */}
              <div className="relative min-h-[400px] max-h-[80vh] flex items-center justify-center bg-black">
                {mediaUrls.get(incident.media[selectedMedia]) ? (
                  <img
                    src={mediaUrls.get(incident.media[selectedMedia])}
                    alt={`Imagen ${selectedMedia + 1}`}
                    className="max-w-full max-h-[80vh] object-contain"
                  />
                ) : (
                  <div className="flex items-center justify-center p-12">
                    <Loader2 className="w-12 h-12 animate-spin text-white" />
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              {incident.media.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigateMedia("prev")}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-12 h-12"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigateMedia("next")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-12 h-12"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                </>
              )}

              {/* File Info */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm p-4 text-white">
                <p className="text-sm truncate">
                  {incident.media[selectedMedia].split("/").pop()}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
