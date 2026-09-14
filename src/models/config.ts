/**
 * The only place in the app that reads `process.env.EXPO_PUBLIC_API_URL`.
 * Everything else (controllers, views) must import `DEFAULT_API_URL` from
 * here. The URL actually used at runtime is resolved by a controller
 * (`controllers/settings-service.ts`), which prefers a user-set override
 * stored in `meta` and falls back to this default.
 */
const FALLBACK_API_URL = 'http://localhost:3000';

const envApiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!envApiUrl) {
  console.warn(
    `[config] EXPO_PUBLIC_API_URL tidak diset. Menggunakan fallback ${FALLBACK_API_URL}. ` +
      'Buat file .env di apps/mobile berdasarkan .env.example.'
  );
}

/** The API URL baked in at build time via `EXPO_PUBLIC_API_URL`, or a localhost fallback. */
export const DEFAULT_API_URL: string = envApiUrl ?? FALLBACK_API_URL;
