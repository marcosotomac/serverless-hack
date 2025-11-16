"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getToken, getUser, getAuthHeaders } from "@/lib/auth"
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react"

interface TestResult {
  name: string
  status: "pending" | "success" | "error"
  message?: string
  details?: any
}

export default function APITestPage() {
  const [tests, setTests] = useState<TestResult[]>([])
  const [running, setRunning] = useState(false)

  const updateTest = (index: number, update: Partial<TestResult>) => {
    setTests(prev => {
      const newTests = [...prev]
      newTests[index] = { ...newTests[index], ...update }
      return newTests
    })
  }

  const runTests = async () => {
    setRunning(true)
    const testCases: TestResult[] = [
      { name: "Verificar autenticación local", status: "pending" },
      { name: "Probar endpoint de incidentes (GET)", status: "pending" },
      { name: "Verificar CORS", status: "pending" },
    ]
    setTests(testCases)

    // Test 1: Check local auth
    const token = getToken()
    const user = getUser()
    if (token && user) {
      updateTest(0, {
        status: "success",
        message: "Token y usuario encontrados",
        details: { email: user.email, role: user.role }
      })
    } else {
      updateTest(0, {
        status: "error",
        message: "No hay sesión activa"
      })
      setRunning(false)
      return
    }

    // Test 2: Try fetching incidents
    try {
      const headers = getAuthHeaders()
      console.log("Headers being sent:", headers)
      
      const response = await fetch(
        "https://2dutzw4lw9.execute-api.us-east-1.amazonaws.com/incidents",
        {
          method: "GET",
          headers: headers,
          mode: "cors",
        }
      )

      console.log("Response:", response)
      
      if (response.ok) {
        const data = await response.json()
        updateTest(1, {
          status: "success",
          message: `Respuesta exitosa: ${data.incidents?.length || 0} incidentes`,
          details: data
        })
      } else {
        const errorText = await response.text()
        updateTest(1, {
          status: "error",
          message: `HTTP ${response.status}: ${response.statusText}`,
          details: { responseText: errorText }
        })
      }
    } catch (err: any) {
      updateTest(1, {
        status: "error",
        message: err.message || "Error de red",
        details: { error: err.toString() }
      })
    }

    // Test 3: CORS check
    try {
      const response = await fetch(
        "https://2dutzw4lw9.execute-api.us-east-1.amazonaws.com/incidents",
        {
          method: "OPTIONS",
        }
      )
      
      const corsHeaders = {
        "Access-Control-Allow-Origin": response.headers.get("Access-Control-Allow-Origin"),
        "Access-Control-Allow-Methods": response.headers.get("Access-Control-Allow-Methods"),
        "Access-Control-Allow-Headers": response.headers.get("Access-Control-Allow-Headers"),
      }
      
      updateTest(2, {
        status: corsHeaders["Access-Control-Allow-Origin"] ? "success" : "error",
        message: corsHeaders["Access-Control-Allow-Origin"] 
          ? "CORS configurado correctamente" 
          : "CORS no configurado",
        details: corsHeaders
      })
    } catch (err: any) {
      updateTest(2, {
        status: "error",
        message: "No se pudo verificar CORS",
        details: { error: err.toString() }
      })
    }

    setRunning(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Diagnóstico de API
          </h1>
          <p className="text-muted-foreground">
            Verifica la conexión con el backend de AlertaUTEC
          </p>
        </div>

        <Card className="border-2 shadow-lg mb-6">
          <CardHeader>
            <CardTitle>Información de Autenticación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Token:</span>
              <Badge variant={getToken() ? "default" : "destructive"}>
                {getToken() ? "Presente" : "No encontrado"}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Usuario:</span>
              <span className="text-sm font-mono">{getUser()?.email || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Rol:</span>
              <Badge>{getUser()?.role || "N/A"}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-lg mb-6">
          <CardHeader>
            <CardTitle>Pruebas de Conectividad</CardTitle>
            <CardDescription>
              Ejecuta pruebas para diagnosticar problemas de conexión
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runTests} 
              disabled={running || !getToken()}
              className="w-full gap-2"
            >
              {running ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Ejecutando pruebas...
                </>
              ) : (
                "Ejecutar Pruebas"
              )}
            </Button>

            {tests.length > 0 && (
              <>
                <Separator className="my-6" />
                <div className="space-y-4">
                  {tests.map((test, index) => (
                    <Card key={index} className="border">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {test.status === "pending" && (
                              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                            )}
                            {test.status === "success" && (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            )}
                            {test.status === "error" && (
                              <XCircle className="w-5 h-5 text-red-500" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm mb-1">
                              {test.name}
                            </div>
                            
                            {test.message && (
                              <div className={`text-sm ${
                                test.status === "success" 
                                  ? "text-green-600 dark:text-green-400" 
                                  : test.status === "error"
                                  ? "text-red-600 dark:text-red-400"
                                  : "text-muted-foreground"
                              }`}>
                                {test.message}
                              </div>
                            )}
                            
                            {test.details && (
                              <details className="mt-2">
                                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                  Ver detalles
                                </summary>
                                <pre className="mt-2 p-3 bg-slate-100 dark:bg-slate-900 rounded text-xs overflow-auto">
                                  {JSON.stringify(test.details, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-dashed">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-semibold text-foreground mb-2">Posibles soluciones:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Verifica que el backend esté desplegado y funcionando</li>
                  <li>Confirma que CORS esté configurado en API Gateway</li>
                  <li>Revisa que el token JWT sea válido</li>
                  <li>Comprueba los logs de CloudWatch para errores del backend</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
