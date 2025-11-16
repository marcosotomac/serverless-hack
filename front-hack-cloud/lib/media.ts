import { getAuthHeaders } from "./auth";

const API_BASE_URL =
  "https://2dutzw4lw9.execute-api.us-east-1.amazonaws.com";

/**
 * Obtiene la URL firmada de un archivo multimedia
 */
export async function getMediaUrl(objectKey: string): Promise<string | null> {
  try {
    const encodedKey = encodeURIComponent(objectKey);
    const response = await fetch(
      `${API_BASE_URL}/incidents/media/${encodedKey}`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      console.error("Error obteniendo URL de media:", await response.text());
      return null;
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error("Error obteniendo URL de media:", error);
    return null;
  }
}

/**
 * Obtiene múltiples URLs firmadas de archivos multimedia
 */
export async function getMediaUrls(
  objectKeys: string[]
): Promise<Map<string, string>> {
  const urlMap = new Map<string, string>();

  await Promise.all(
    objectKeys.map(async (key) => {
      const url = await getMediaUrl(key);
      if (url) {
        urlMap.set(key, url);
      }
    })
  );

  return urlMap;
}

/**
 * Sube un archivo multimedia y retorna la clave del objeto
 */
export async function uploadMedia(
  file: File,
  incidentId?: string
): Promise<string | null> {
  try {
    // 1. Solicitar URL de carga
    const uploadResponse = await fetch(`${API_BASE_URL}/incidents/media/upload`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        contentType: file.type,
        fileName: file.name,
        incidentId,
      }),
    });

    if (!uploadResponse.ok) {
      throw new Error("Error al solicitar URL de carga");
    }

    const uploadData = await uploadResponse.json();
    const { uploadUrl, objectKey } = uploadData;

    // 2. Subir archivo a S3
    const s3Response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    if (!s3Response.ok) {
      throw new Error("Error al subir el archivo");
    }

    return objectKey;
  } catch (error) {
    console.error("Error subiendo archivo:", error);
    return null;
  }
}
