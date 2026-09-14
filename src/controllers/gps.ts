import * as Location from 'expo-location';

/** GPS timeout: saving must never hang waiting for a fix. */
const GPS_TIMEOUT_MS = 5000;

export interface CapturedLocation {
  latitude: number | null;
  longitude: number | null;
}

function delay(ms: number): Promise<null> {
  return new Promise((resolve) => setTimeout(() => resolve(null), ms));
}

/**
 * Captures the device's current position for a new record. Tries the
 * last-known position first (instant, works offline/airplane mode), then
 * falls back to a fresh fix raced against a timeout. Never throws and never
 * hangs longer than `GPS_TIMEOUT_MS` — on any failure or denied permission it
 * resolves to `{ latitude: null, longitude: null }`.
 */
export async function captureLocation(): Promise<CapturedLocation> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') {
      return { latitude: null, longitude: null };
    }

    const lastKnown = await Location.getLastKnownPositionAsync().catch(() => null);
    if (lastKnown) {
      return { latitude: lastKnown.coords.latitude, longitude: lastKnown.coords.longitude };
    }

    const current = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.LocationAccuracy.Balanced }).catch(
        () => null
      ),
      delay(GPS_TIMEOUT_MS),
    ]);

    if (current) {
      return { latitude: current.coords.latitude, longitude: current.coords.longitude };
    }
    return { latitude: null, longitude: null };
  } catch {
    return { latitude: null, longitude: null };
  }
}
