"use client";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ThemeToggle } from "@/components/theme-toggle";
import { AnimatedSection } from "@/components/animated-section";
import { TypingText } from "@/components/typing-text";
import { AnimatedBackground } from "@/components/animated-background";
import {
  AlertCircle,
  Bell,
  MapPin,
  Shield,
  Zap,
  Users,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Activity,
  BarChart3,
  Clock,
  MessageSquare,
  Star,
  Sparkles,
  Rocket,
  Target,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Mesh Gradient Overlay */}
      <div className="fixed inset-0 mesh-gradient pointer-events-none z-0" />

      {/* Blobs decorativos */}
      <div className="fixed top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl blob" />
      <div
        className="fixed bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl blob"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl blob"
        style={{ animationDelay: "4s" }}
      />

      {/* Content Container */}
      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-4 z-50 px-4">
          <div className="container mx-auto">
            <div className="flex items-center justify-between bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-3 shadow-lg">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h1 className="text-2xl font-bold gradient-text">AlertaUTEC</h1>
              </div>
              <nav className="hidden md:flex items-center gap-6">
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <a
                      href="#features"
                      className="text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
                    >
                      Características
                    </a>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="flex justify-between space-x-4">
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold">
                          Características
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Descubre todas las funcionalidades de AlertaUTEC
                        </p>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
                <a
                  href="#how-it-works"
                  className="text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
                >
                  Cómo Funciona
                </a>
                <a
                  href="#stats"
                  className="text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
                >
                  Estadísticas
                </a>
                <a
                  href="#faq"
                  className="text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
                >
                  FAQ
                </a>
              </nav>
              <div className="flex items-center gap-2 md:gap-3">
                <ThemeToggle />
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:inline-flex"
                  onClick={() => (window.location.href = "/auth/login")}
                >
                  Iniciar Sesión
                </Button>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm px-3 sm:px-4"
                  onClick={() => (window.location.href = "/auth/register")}
                >
                  <span className="hidden sm:inline">Registrarse</span>
                  <span className="sm:hidden">Registro</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-12 md:py-20 relative">
          <AnimatedSection>
            <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
              <Badge
                variant="secondary"
                className="mb-8 px-6 py-3 text-base backdrop-blur-sm bg-white/60 dark:bg-slate-900/60 border-2 border-blue-200 dark:border-blue-800 shadow-lg"
              >
                <Sparkles className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="font-semibold">
                  Plataforma 100% Serverless en AWS
                </span>
              </Badge>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight text-slate-900 dark:text-white mb-6 md:mb-8 leading-tight">
                <span className="block mb-2 md:mb-4">Reporta y Gestiona</span>
                <span className="block mb-2 md:mb-4">
                  <TypingText
                    texts={[
                      "Incidentes 🚨",
                      "Emergencias 🆘",
                      "Problemas 🔧",
                      "Alertas ⚡",
                    ]}
                    typingSpeed={150}
                    deletingSpeed={100}
                    pauseTime={2000}
                    className="text-blue-600 dark:text-blue-400"
                  />
                </span>
                <span className="block relative">
                  en{" "}
                  <span className="relative inline-block">
                    <span className="gradient-text">Tiempo Real</span>
                    <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 rounded-full animate-pulse"></div>
                  </span>
                </span>
              </h1>

              <p className="text-lg sm:text-xl md:text-2xl text-slate-700 dark:text-slate-300 mb-8 md:mb-12 max-w-3xl leading-relaxed font-medium px-4">
                AlertaUTEC conecta a la comunidad universitaria con las
                autoridades para resolver incidentes de forma{" "}
                <span className="relative inline-block">
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    ágil, segura y centralizada
                  </span>
                  <svg
                    className="absolute -bottom-1 left-0 w-full"
                    height="8"
                    viewBox="0 0 200 8"
                    fill="none"
                  >
                    <path
                      d="M0 4 Q50 0, 100 4 T200 4"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      className="text-blue-600 dark:text-blue-400"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </p>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-12 md:mb-16 w-full sm:w-auto px-4">
                <Button
                  size="lg"
                  className="text-base sm:text-lg px-6 sm:px-8 py-6 sm:py-7 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-2xl hover:shadow-blue-500/50 transform hover:scale-105 transition-all duration-300 group w-full sm:w-auto"
                  onClick={() => (window.location.href = "/auth/register")}
                >
                  <Rocket className="mr-2 sm:mr-3 h-5 sm:h-6 w-5 sm:w-6 group-hover:rotate-12 transition-transform" />
                  <span className="hidden sm:inline">Reportar Incidente Ahora</span>
                  <span className="sm:hidden">Reportar Ahora</span>
                  <ArrowRight className="ml-2 sm:ml-3 h-5 sm:h-6 w-5 sm:w-6 group-hover:translate-x-2 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base sm:text-lg px-6 sm:px-8 py-6 sm:py-7 border-3 backdrop-blur-sm bg-white/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 transform hover:scale-105 transition-all duration-300 w-full sm:w-auto"
                  onClick={() => (window.location.href = "/auth/login")}
                >
                  <Target className="mr-2 h-5 sm:h-6 w-5 sm:w-6" />
                  Ver Demo Interactiva
                </Button>
              </div>

              {/* Stats con efectos únicos */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl">
                <Card className="border-2 border-blue-200 dark:border-blue-800 backdrop-blur-sm bg-white/70 dark:bg-slate-900/70 hover:shadow-2xl hover:shadow-blue-500/20 transform hover:-translate-y-2 transition-all duration-300">
                  <CardContent className="pt-6 text-center">
                    <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 mb-2">
                      24/7
                    </div>
                    <div className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Disponibilidad Total
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-2 border-purple-200 dark:border-purple-800 backdrop-blur-sm bg-white/70 dark:bg-slate-900/70 hover:shadow-2xl hover:shadow-purple-500/20 transform hover:-translate-y-2 transition-all duration-300">
                  <CardContent className="pt-6 text-center">
                    <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-purple-800 dark:from-purple-400 dark:to-purple-600 mb-2">
                      &lt;2s
                    </div>
                    <div className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Tiempo de Respuesta
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-2 border-indigo-200 dark:border-indigo-800 backdrop-blur-sm bg-white/70 dark:bg-slate-900/70 hover:shadow-2xl hover:shadow-indigo-500/20 transform hover:-translate-y-2 transition-all duration-300">
                  <CardContent className="pt-6 text-center">
                    <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-800 dark:from-indigo-400 dark:to-indigo-600 mb-2">
                      99.9%
                    </div>
                    <div className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Uptime Garantizado
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </AnimatedSection>
        </section>

        {/* Features Section with Tabs */}
        <section
          id="features"
          className="container mx-auto px-4 py-20 bg-slate-50/50 dark:bg-slate-900/30 rounded-3xl"
        >
          <AnimatedSection delay={100}>
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">
                Características
              </Badge>
              <h3 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
                Todo lo que Necesitas
              </h3>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Diseñada para optimizar la comunicación y respuesta ante
                incidentes
              </p>
            </div>

            <Tabs defaultValue="all" className="max-w-6xl mx-auto">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-8">
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="tech">
                  <span className="hidden sm:inline">Tecnología</span>
                  <span className="sm:hidden">Tech</span>
                </TabsTrigger>
                <TabsTrigger value="security">
                  <span className="hidden sm:inline">Seguridad</span>
                  <span className="sm:hidden">Segur.</span>
                </TabsTrigger>
                <TabsTrigger value="analytics">
                  <span className="hidden sm:inline">Análisis</span>
                  <span className="sm:hidden">Análi.</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="border-2 hover:border-blue-500 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <CardHeader>
                      <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg w-fit">
                        <Bell className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <CardTitle>Notificaciones en Tiempo Real</CardTitle>
                      <CardDescription>
                        Recibe actualizaciones instantáneas mediante WebSockets
                        sobre el estado de tus reportes
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card className="border-2 hover:border-blue-500 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <CardHeader>
                      <div className="mb-4 p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg w-fit">
                        <MapPin className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                      </div>
                      <CardTitle>Geolocalización Precisa</CardTitle>
                      <CardDescription>
                        Identifica exactamente dónde ocurren los incidentes
                        dentro del campus universitario
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card className="border-2 hover:border-blue-500 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <CardHeader>
                      <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg w-fit">
                        <Shield className="h-8 w-8 text-green-600 dark:text-green-400" />
                      </div>
                      <CardTitle>Seguridad y Control</CardTitle>
                      <CardDescription>
                        Autenticación institucional con roles diferenciados para
                        estudiantes, personal y autoridades
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card className="border-2 hover:border-blue-500 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <CardHeader>
                      <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg w-fit">
                        <Zap className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <CardTitle>Respuesta Automática</CardTitle>
                      <CardDescription>
                        Clasificación inteligente con Apache Airflow para
                        priorizar y asignar incidentes
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card className="border-2 hover:border-blue-500 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <CardHeader>
                      <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg w-fit">
                        <Users className="h-8 w-8 text-red-600 dark:text-red-400" />
                      </div>
                      <CardTitle>Panel Administrativo</CardTitle>
                      <CardDescription>
                        Gestiona todos los reportes desde un dashboard
                        centralizado con filtros y priorización
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card className="border-2 hover:border-blue-500 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <CardHeader>
                      <div className="mb-4 p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg w-fit">
                        <TrendingUp className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <CardTitle>Análisis Predictivo</CardTitle>
                      <CardDescription>
                        Modelos de ML con SageMaker para identificar patrones y
                        zonas de riesgo
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="tech">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-600" />
                        WebSocket en Tiempo Real
                      </CardTitle>
                      <CardDescription>
                        Comunicación bidireccional instantánea mediante API
                        Gateway WebSocket
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-600" />
                        Arquitectura Serverless
                      </CardTitle>
                      <CardDescription>
                        AWS Lambda, DynamoDB, S3 para escalabilidad automática
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="security">
                <Card>
                  <CardHeader>
                    <CardTitle>Seguridad de Nivel Empresarial</CardTitle>
                    <CardDescription>
                      Implementamos las mejores prácticas de seguridad en la
                      nube
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span>Autenticación multi-factor</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span>Encriptación end-to-end</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span>Control de acceso basado en roles (RBAC)</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-6 w-6 text-blue-600" />
                      Análisis Avanzado
                    </CardTitle>
                    <CardDescription>
                      Machine Learning para detectar patrones y predecir
                      incidentes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          85%
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          Precisión ML
                        </div>
                      </div>
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600 mb-1">
                          15min
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          Tiempo Análisis
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </AnimatedSection>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="container mx-auto px-4 py-20">
          <AnimatedSection delay={200}>
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">
                Proceso
              </Badge>
              <h3 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
                ¿Cómo Funciona?
              </h3>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Tres simples pasos para reportar y resolver incidentes
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <Card className="text-center border-2 hover:border-blue-500 hover:shadow-xl transition-all duration-300">
                <CardContent className="pt-8">
                  <div className="relative mx-auto mb-6">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto shadow-lg">
                      1
                    </div>
                    <div className="absolute -top-2 -right-2">
                      <AlertCircle className="h-8 w-8 text-blue-600 animate-pulse" />
                    </div>
                  </div>
                  <h4 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">
                    Reporta
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400">
                    Describe el incidente, agrega la ubicación y el nivel de
                    urgencia en segundos
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-2 hover:border-purple-500 hover:shadow-xl transition-all duration-300">
                <CardContent className="pt-8">
                  <div className="relative mx-auto mb-6">
                    <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto shadow-lg">
                      2
                    </div>
                    <div className="absolute -top-2 -right-2">
                      <Clock className="h-8 w-8 text-purple-600 animate-pulse" />
                    </div>
                  </div>
                  <h4 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">
                    Seguimiento
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400">
                    Recibe actualizaciones en tiempo real sobre el estado y
                    progreso de tu reporte
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-2 hover:border-green-500 hover:shadow-xl transition-all duration-300">
                <CardContent className="pt-8">
                  <div className="relative mx-auto mb-6">
                    <div className="w-20 h-20 bg-gradient-to-r from-green-600 to-green-700 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto shadow-lg">
                      3
                    </div>
                    <div className="absolute -top-2 -right-2">
                      <CheckCircle2 className="h-8 w-8 text-green-600 animate-pulse" />
                    </div>
                  </div>
                  <h4 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">
                    Resolución
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400">
                    Las autoridades atienden y resuelven el incidente de forma
                    eficiente y documentada
                  </p>
                </CardContent>
              </Card>
            </div>
          </AnimatedSection>
        </section>

        {/* Testimonials */}
        <section
          id="stats"
          className="container mx-auto px-4 py-20 bg-slate-50/50 dark:bg-slate-900/30 rounded-3xl"
        >
          <AnimatedSection delay={300}>
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">
                Testimonios
              </Badge>
              <h3 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
                Lo que Dicen los Usuarios
              </h3>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <Card className="hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-blue-600 text-white">
                        JD
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">Juan Díaz</CardTitle>
                      <CardDescription>Estudiante</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    "Increíble la velocidad de respuesta. Reporté un problema y
                    fue atendido en minutos."
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-purple-600 text-white">
                        MG
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">María García</CardTitle>
                      <CardDescription>Personal Admin.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    "El panel administrativo es muy intuitivo. Puedo gestionar
                    todos los reportes fácilmente."
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-green-600 text-white">
                        RL
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">Roberto López</CardTitle>
                      <CardDescription>Autoridad</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    "La clasificación automática nos ahorra mucho tiempo. Muy
                    eficiente."
                  </p>
                </CardContent>
              </Card>
            </div>
          </AnimatedSection>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="container mx-auto px-4 py-20">
          <AnimatedSection delay={400}>
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">
                FAQ
              </Badge>
              <h3 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
                Preguntas Frecuentes
              </h3>
            </div>

            <Accordion type="single" collapsible className="max-w-3xl mx-auto">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-left">
                  ¿Cómo puedo reportar un incidente?
                </AccordionTrigger>
                <AccordionContent>
                  Simplemente haz clic en "Reportar Incidente", describe el
                  problema, agrega la ubicación y selecciona el nivel de
                  urgencia. El sistema automáticamente notificará a las
                  autoridades correspondientes.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger className="text-left">
                  ¿Qué tipo de incidentes puedo reportar?
                </AccordionTrigger>
                <AccordionContent>
                  Puedes reportar problemas de infraestructura, fallas en
                  servicios, emergencias, problemas de seguridad, y cualquier
                  situación que requiera atención de las autoridades.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger className="text-left">
                  ¿Cuánto tiempo tarda en atenderse un reporte?
                </AccordionTrigger>
                <AccordionContent>
                  Los reportes se clasifican automáticamente por prioridad. Los
                  incidentes urgentes reciben atención inmediata, mientras que
                  los menos críticos se programan según disponibilidad.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger className="text-left">
                  ¿Es segura la plataforma?
                </AccordionTrigger>
                <AccordionContent>
                  Sí, utilizamos autenticación institucional, encriptación de
                  datos y seguimos las mejores prácticas de seguridad en AWS.
                  Toda la información está protegida y solo accesible por
                  usuarios autorizados.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger className="text-left">
                  ¿Puedo hacer seguimiento de mis reportes?
                </AccordionTrigger>
                <AccordionContent>
                  Absolutamente. Recibirás notificaciones en tiempo real sobre
                  el estado de tus reportes y podrás ver el historial completo
                  de acciones tomadas.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </AnimatedSection>
        </section>

        <Separator className="container mx-auto" />

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20">
          <AnimatedSection delay={500}>
            <Card className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 dark:from-blue-500 dark:via-purple-500 dark:to-blue-600 border-0 text-white overflow-hidden relative">
              <div className="absolute inset-0 bg-grid-white/10"></div>
              <CardContent className="p-12 md:p-16 text-center relative z-10">
                <div className="flex justify-center mb-6">
                  <MessageSquare className="h-16 w-16 animate-float" />
                </div>
                <h3 className="text-4xl md:text-5xl font-bold mb-6">
                  ¿Listo para Mejorar la Seguridad del Campus?
                </h3>
                <p className="text-xl mb-10 opacity-90 max-w-2xl mx-auto leading-relaxed">
                  Únete a la comunidad AlertaUTEC y contribuye a crear un campus
                  más seguro, eficiente y conectado para todos
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="text-base text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Comenzar Ahora
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-base bg-transparent text-white border-2 border-white hover:bg-white/20"
                  >
                    Más Información
                  </Button>
                </div>
              </CardContent>
            </Card>
          </AnimatedSection>
        </section>

        {/* Footer */}
        <footer className="border-t bg-slate-50 dark:bg-slate-950">
          <div className="container mx-auto px-4 py-12">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div className="col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  <span className="text-lg font-bold gradient-text">
                    AlertaUTEC
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Plataforma serverless para gestión de incidentes
                  universitarios en tiempo real.
                </p>
                <div className="flex gap-4">
                  <Badge variant="outline">AWS Lambda</Badge>
                  <Badge variant="outline">DynamoDB</Badge>
                  <Badge variant="outline">WebSocket</Badge>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-4 text-slate-900 dark:text-white">
                  Enlaces
                </h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a
                      href="#features"
                      className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                    >
                      Características
                    </a>
                  </li>
                  <li>
                    <a
                      href="#how-it-works"
                      className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                    >
                      Cómo Funciona
                    </a>
                  </li>
                  <li>
                    <a
                      href="#stats"
                      className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                    >
                      Estadísticas
                    </a>
                  </li>
                  <li>
                    <a
                      href="#faq"
                      className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                    >
                      FAQ
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4 text-slate-900 dark:text-white">
                  Legal
                </h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a
                      href="#"
                      className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                    >
                      Privacidad
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                    >
                      Términos
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                    >
                      Cookies
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                    >
                      Soporte
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <Separator className="my-8" />

            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                © 2025 AlertaUTEC - Hackathon Cloud Computing UTEC. Todos los
                derechos reservados.
              </p>
              <div className="flex gap-4">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
