// API Configuration and Helper Functions

export const API_BASE_URL = "https://2dutzw4lw9.execute-api.us-east-1.amazonaws.com";

export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,

  // Incidents
  INCIDENTS: `${API_BASE_URL}/incidents`,
  INCIDENT_BY_ID: (id: string) => `${API_BASE_URL}/incidents/${id}`,
  INCIDENT_HISTORY: (id: string) => `${API_BASE_URL}/incidents/${id}/history`,
  INCIDENT_PRIORITY: (id: string) => `${API_BASE_URL}/incidents/${id}/priority`,
  INCIDENT_CLOSE: (id: string) => `${API_BASE_URL}/incidents/${id}/close`,

  // Admin
  ADMIN_INCIDENTS: `${API_BASE_URL}/admin/incidents`,
};

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string }> {
  try {
    const response = await fetch(endpoint, {
      mode: "cors",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error:
          data.message || `Error: ${response.status} ${response.statusText}`,
      };
    }

    return { data };
  } catch (err) {
    console.error("API Request Error:", err);
    return {
      error:
        err instanceof Error
          ? err.message
          : "Error de conexión con el servidor",
    };
  }
}
