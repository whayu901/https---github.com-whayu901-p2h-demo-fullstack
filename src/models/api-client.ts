import { API_ROUTES, type HealthResponse, type SyncBatchRequest, type SyncBatchResponse } from '@p2h/shared';

/**
 * The only place in the app that calls `fetch`. Every function here takes the
 * base URL as a parameter — resolving *which* URL to use (env default vs. a
 * user override) is a controller's job, not this module's.
 */

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Result of a health check attempt against the API. */
export type HealthCheckResult =
  | { reachable: true; response: HealthResponse }
  | { reachable: false };

/** Pings `GET /health` on `baseUrl` with a short timeout. Never throws. */
export async function checkHealth(baseUrl: string, timeoutMs = 3000): Promise<HealthCheckResult> {
  try {
    const response = await fetchWithTimeout(`${baseUrl}${API_ROUTES.health}`, {}, timeoutMs);
    if (!response.ok) {
      return { reachable: false };
    }
    const body = (await response.json()) as HealthResponse;
    return { reachable: true, response: body };
  } catch {
    return { reachable: false };
  }
}

/** Error thrown when a sync batch push fails, carrying a plain Indonesian message. */
export class SyncError extends Error {}

/** Posts a batch of pending records to `POST {baseUrl}/sync/batch`. Throws `SyncError` on failure. */
export async function postSyncBatch(
  baseUrl: string,
  batch: SyncBatchRequest,
  timeoutMs = 20000
): Promise<SyncBatchResponse> {
  let response: Response;
  try {
    response = await fetchWithTimeout(
      `${baseUrl}${API_ROUTES.syncBatch}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch),
      },
      timeoutMs
    );
  } catch {
    throw new SyncError('Gagal sinkronisasi: server tidak dapat dijangkau');
  }

  if (!response.ok) {
    const message = await extractErrorMessage(response);
    throw new SyncError(message ?? 'Gagal sinkronisasi: server menolak permintaan');
  }

  return (await response.json()) as SyncBatchResponse;
}

async function extractErrorMessage(response: Response): Promise<string | null> {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message ?? null;
  } catch {
    return null;
  }
}
