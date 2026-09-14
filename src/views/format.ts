import { STATUS_KELAYAKAN_LABELS, type StatusKelayakan } from '@p2h/shared';

import type { BadgeTone } from './components/Badge';

/** Pure, presentation-only formatting helpers. No business logic here. */

const STATUS_KELAYAKAN_BADGE_TONE: Record<StatusKelayakan, BadgeTone> = {
  STOP_OPERASI: 'stopOperasi',
  OPERASI_DENGAN_PERHATIAN: 'perhatian',
  LAYAK_OPERASI: 'layak',
};

/** Maps a P2H verdict to its `Badge` tone and Indonesian label. */
export function statusKelayakanBadge(status: StatusKelayakan): { label: string; tone: BadgeTone } {
  return { label: STATUS_KELAYAKAN_LABELS[status], tone: STATUS_KELAYAKAN_BADGE_TONE[status] };
}

const MONTHS_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

function pad2(value: number): string {
  return value.toString().padStart(2, '0');
}

/** Formats an ISO timestamp as "14 Sep 2026, 08:15". */
export function formatDateTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  const day = date.getDate();
  const month = MONTHS_ID[date.getMonth()];
  const year = date.getFullYear();
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

/** Formats latitude/longitude to 5 decimals, or a placeholder when unavailable. */
export function formatCoordinates(latitude: number | null, longitude: number | null): string {
  if (latitude === null || longitude === null) {
    return 'Lokasi tidak tersedia';
  }
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

/** Formats a byte count as "12 KB" / "3.4 MB", for the Pengaturan storage summary. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}
