"use client";

import { useEffect, useState } from "react";
import { getAuthHeaders, getUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminTestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const user = getUser();

  const testAdminEndpoint = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      console.log("Testing with headers:", headers);
      console.log("User:", user);

      const response = await fetch(
        "https://2dutzw4lw9.execute-api.us-east-1.amazonaws.com/admin/incidents",
        { headers }
      );

      console.log("Response status:", response.status);

      const text = await response.text();
      console.log("Raw response:", text);

      try {
        const json = JSON.parse(text);
        setResult({
          status: response.status,
          ok: response.ok,
          data: json,
          incidentsCount: json.incidents?.length || 0,
        });
      } catch (e) {
        setResult({
          status: response.status,
          ok: response.ok,
          error: "Invalid JSON",
          rawText: text,
        });
      }
    } catch (err: any) {
      console.error("Error:", err);
      setResult({
        error: err.message,
        stack: err.stack,
      });
    } finally {
      setLoading(false);
    }
  };

  const testRegularEndpoint = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      console.log("Testing regular endpoint with headers:", headers);

      const response = await fetch(
        "https://2dutzw4lw9.execute-api.us-east-1.amazonaws.com/incidents",
        { headers }
      );

      console.log("Response status:", response.status);

      const text = await response.text();
      console.log("Raw response:", text);

      try {
        const json = JSON.parse(text);
        setResult({
          status: response.status,
          ok: response.ok,
          data: json,
          incidentsCount: json.incidents?.length || 0,
        });
      } catch (e) {
        setResult({
          status: response.status,
          ok: response.ok,
          error: "Invalid JSON",
          rawText: text,
        });
      }
    } catch (err: any) {
      console.error("Error:", err);
      setResult({
        error: err.message,
        stack: err.stack,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Admin Endpoint Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-bold mb-2">Current User:</h3>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>

          <div className="flex gap-2">
            <Button onClick={testAdminEndpoint} disabled={loading}>
              Test Admin Endpoint
            </Button>
            <Button
              onClick={testRegularEndpoint}
              disabled={loading}
              variant="outline"
            >
              Test Regular Endpoint
            </Button>
          </div>

          {loading && <p>Loading...</p>}

          {result && (
            <div>
              <h3 className="font-bold mb-2">Result:</h3>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
