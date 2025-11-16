"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getAuthHeaders } from "@/lib/auth";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MapPin,
  FileText,
  Zap,
  ArrowLeft,
  Image as ImageIcon,
  Video,
  Upload,
  Loader2,
  Trash2,
} from "lucide-react";

type UrgencyLevel = "baja" | "media" | "alta" | "critica";
type IncidentType =
  | "infraestructura"
  | "servicios"
  | "emergencia"
  | "seguridad"
  | "tecnologia"
  | "otros";

interface MediaFile {
  file: File;
  preview: string;
  uploading: boolean;
  uploaded: boolean;
  key?: string;
  error?: string;
}

const URGENCY_CONFIG = {
  baja: {
    label: "Baja",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    icon: CheckCircle2,
    description: "No requiere atención inmediata",
  },
  media: {
    label: "Media",
    color:
      "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    icon: AlertCircle,
    description: "Requiere atención en 24-48 horas",
  },
  alta: {
    label: "Alta",
    color:
      "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    icon: AlertTriangle,
    description: "Requiere atención urgente",
  },
  critica: {
    label: "Crítica",
    color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    icon: XCircle,
    description: "Emergencia - Atención inmediata",
  },
};

const INCIDENT_TYPES = [
  {
    value: "infraestructura",
    label: "Infraestructura",
    emoji: "🏗️",
    description: "Problemas estructurales, daños físicos",
  },
  {
    value: "servicios",
    label: "Servicios",
    emoji: "🔧",
    description: "Fallas en servicios básicos",
  },
  {
    value: "emergencia",
    label: "Emergencia",
    emoji: "🚨",
    description: "Situaciones de riesgo inmediato",
  },
  {
    value: "seguridad",
    label: "Seguridad",
    emoji: "🛡️",
    description: "Problemas de seguridad o acceso",
  },
  {
    value: "tecnologia",
    label: "Tecnología",
    emoji: "💻",
    description: "Fallas tecnológicas o sistemas",
  },
  {
    value: "otros",
    label: "Otros",
    emoji: "📋",
    description: "Otros tipos de incidentes",
  },
];

export default function NewIncidentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);

  const [formData, setFormData] = useState({
    type: "" as IncidentType | "",
    location: "",
    description: "",
    urgency: "media" as UrgencyLevel,
    note: "",
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validar tipo de archivo
    const validFiles = files.filter((file) => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");

      if (!isImage && !isVideo) {
        toast.error(`${file.name} no es una imagen o video válido`);
        return false;
      }

      // Validar tamaño (max 50MB)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`${file.name} es demasiado grande (máx 50MB)`);
        return false;
      }

      return true;
    });

    // Crear previsualizaciones
    const newMediaFiles: MediaFile[] = validFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: false,
      uploaded: false,
    }));

    setMediaFiles((prev) => [...prev, ...newMediaFiles]);

    // Limpiar input
    e.target.value = "";
  };

  const removeMediaFile = (index: number) => {
    setMediaFiles((prev) => {
      const file = prev[index];
      URL.revokeObjectURL(file.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadMediaFile = async (
    mediaFile: MediaFile,
    index: number
  ): Promise<string | null> => {
    try {
      // Actualizar estado a "subiendo"
      setMediaFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, uploading: true, error: undefined } : f
        )
      );

      // 1. Solicitar URL de carga
      const uploadResponse = await fetch(
        "https://2dutzw4lw9.execute-api.us-east-1.amazonaws.com/incidents/media/upload",
        {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contentType: mediaFile.file.type,
            fileName: mediaFile.file.name,
          }),
        }
      );

      if (!uploadResponse.ok) {
        throw new Error("Error al solicitar URL de carga");
      }

      const uploadData = await uploadResponse.json();
      const { uploadUrl, objectKey } = uploadData;

      // 2. Subir archivo a S3
      const s3Response = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": mediaFile.file.type,
        },
        body: mediaFile.file,
      });

      if (!s3Response.ok) {
        throw new Error("Error al subir el archivo");
      }

      // Actualizar estado a "subido"
      setMediaFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? { ...f, uploading: false, uploaded: true, key: objectKey }
            : f
        )
      );

      return objectKey;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al subir archivo";

      // Actualizar estado a "error"
      setMediaFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, uploading: false, error: errorMessage } : f
        )
      );

      toast.error(`Error al subir ${mediaFile.file.name}`);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Subir archivos multimedia primero
      const mediaKeys: string[] = [];

      for (let i = 0; i < mediaFiles.length; i++) {
        const mediaFile = mediaFiles[i];

        if (mediaFile.uploaded && mediaFile.key) {
          // Ya está subido
          mediaKeys.push(mediaFile.key);
        } else if (!mediaFile.uploading && !mediaFile.error) {
          // Necesita subirse
          const key = await uploadMediaFile(mediaFile, i);
          if (key) {
            mediaKeys.push(key);
          }
        }
      }

      // 2. Crear el incidente con las claves de los archivos
      const response = await fetch(
        "https://2dutzw4lw9.execute-api.us-east-1.amazonaws.com/incidents",
        {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            mediaKeys,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Incidente reportado exitosamente");
        router.push("/incidents");
      } else {
        setError(data.message || "Error al crear el incidente");
      }
    } catch (err) {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-1/4 -right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-1/4 left-1/3 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>

          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Reportar Nuevo Incidente
            </h1>
            <p className="text-muted-foreground text-lg">
              Completa el formulario con los detalles del incidente
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type Selection Card */}
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Tipo de Incidente
              </CardTitle>
              <CardDescription>
                Selecciona la categoría que mejor describa el incidente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {INCIDENT_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        type: type.value as IncidentType,
                      })
                    }
                    className={`
                      p-4 rounded-lg border-2 text-left transition-all
                      ${
                        formData.type === type.value
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-md scale-105"
                          : "border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:scale-102"
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{type.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm">
                          {type.label}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {type.description}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Location Card */}
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-600" />
                Ubicación del Incidente
              </CardTitle>
              <CardDescription>
                Indica dónde ocurrió o está ocurriendo el incidente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Ej: Edificio A, 3er piso, Laboratorio 301"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="text-base"
                required
              />
            </CardContent>
          </Card>

          {/* Description Card */}
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Descripción del Incidente
              </CardTitle>
              <CardDescription>
                Describe con detalle lo que está sucediendo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Describe el incidente con el mayor detalle posible..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={5}
                className="text-base resize-none"
                required
              />
            </CardContent>
          </Card>

          {/* Urgency Card */}
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-600" />
                Nivel de Urgencia
              </CardTitle>
              <CardDescription>
                Indica qué tan urgente es atender este incidente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={formData.urgency}
                onValueChange={(value) =>
                  setFormData({ ...formData, urgency: value as UrgencyLevel })
                }
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {(Object.keys(URGENCY_CONFIG) as UrgencyLevel[]).map(
                  (urgency) => {
                    const config = URGENCY_CONFIG[urgency];
                    const Icon = config.icon;

                    return (
                      <div key={urgency} className="relative">
                        <RadioGroupItem
                          value={urgency}
                          id={urgency}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={urgency}
                          className={`
                          flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                          peer-data-[state=checked]:border-current peer-data-[state=checked]:shadow-lg
                          peer-data-[state=checked]:scale-105
                          ${config.color}
                        `}
                        >
                          <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="font-semibold">{config.label}</div>
                            <div className="text-xs opacity-80 mt-1">
                              {config.description}
                            </div>
                          </div>
                        </Label>
                      </div>
                    );
                  }
                )}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Additional Notes Card */}
          <Card className="border-2 shadow-lg border-dashed">
            <CardHeader>
              <CardTitle className="text-base">
                Notas Adicionales (Opcional)
              </CardTitle>
              <CardDescription>
                Información extra que pueda ser útil
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Notas adicionales, contexto, observaciones..."
                value={formData.note}
                onChange={(e) =>
                  setFormData({ ...formData, note: e.target.value })
                }
                rows={3}
                className="text-base resize-none"
              />
            </CardContent>
          </Card>

          {/* Media Upload Card */}
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-green-600" />
                Archivos Multimedia (Opcional)
              </CardTitle>
              <CardDescription>
                Adjunta fotos o videos del incidente (máx 50MB por archivo)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload Button */}
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="media-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-slate-500" />
                    <p className="mb-2 text-sm text-slate-500">
                      <span className="font-semibold">Click para subir</span> o
                      arrastra archivos
                    </p>
                    <p className="text-xs text-slate-400">
                      Imágenes o videos (máx 50MB)
                    </p>
                  </div>
                  <input
                    id="media-upload"
                    type="file"
                    className="hidden"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileSelect}
                    disabled={loading}
                  />
                </label>
              </div>

              {/* Media Files Preview */}
              {mediaFiles.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Archivos ({mediaFiles.length})
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        mediaFiles.forEach((f) =>
                          URL.revokeObjectURL(f.preview)
                        );
                        setMediaFiles([]);
                      }}
                      disabled={loading}
                      className="text-xs"
                    >
                      Limpiar todo
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {mediaFiles.map((mediaFile, index) => {
                      const isVideo = mediaFile.file.type.startsWith("video/");

                      return (
                        <div
                          key={index}
                          className="relative group rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900"
                        >
                          {/* Preview */}
                          <div className="aspect-square relative bg-slate-200 dark:bg-slate-800">
                            {isVideo ? (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Video className="w-12 h-12 text-slate-400" />
                              </div>
                            ) : (
                              <img
                                src={mediaFile.preview}
                                alt={mediaFile.file.name}
                                className="w-full h-full object-cover"
                              />
                            )}

                            {/* Status Overlay */}
                            {mediaFile.uploading && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                              </div>
                            )}

                            {mediaFile.uploaded && (
                              <div className="absolute top-2 right-2">
                                <Badge className="bg-green-500 text-white border-0">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Subido
                                </Badge>
                              </div>
                            )}

                            {mediaFile.error && (
                              <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center p-2">
                                <p className="text-xs text-red-600 dark:text-red-400 text-center font-medium">
                                  {mediaFile.error}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* File Info */}
                          <div className="p-2 bg-white dark:bg-slate-950">
                            <p className="text-xs truncate font-medium">
                              {mediaFile.file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(mediaFile.file.size / 1024 / 1024).toFixed(2)}{" "}
                              MB
                            </p>
                          </div>

                          {/* Remove Button */}
                          <button
                            type="button"
                            onClick={() => removeMediaFile(index)}
                            disabled={loading || mediaFile.uploading}
                            className="absolute top-2 left-2 p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <XCircle className="w-5 h-5" />
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                loading || !formData.type || mediaFiles.some((f) => f.uploading)
              }
              className="flex-1 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {mediaFiles.some((f) => f.uploading)
                    ? "Subiendo archivos..."
                    : "Creando..."}
                </>
              ) : (
                "Crear Reporte"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
