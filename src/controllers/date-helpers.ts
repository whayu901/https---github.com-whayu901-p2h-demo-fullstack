/** Small date/time helpers shared by the P2H and P5M form controllers. */

function pad2(value: number): string {
  return value.toString().padStart(2, '0');
}

/** Today's local date as `YYYY-MM-DD`, used as the default for date fields. */
export function todayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

/** The current local time as `HH:mm`, used as the default for P5M's jamMulai. */
export function nowTimeString(): string {
  const now = new Date();
  return `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Validates the `YYYY-MM-DD` shape used throughout the app for `tanggal`. */
export function isValidDateString(value: string): boolean {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

/** Validates the `HH:mm` shape used for P5M's `jamMulai`. */
export function isValidTimeString(value: string): boolean {
  return TIME_PATTERN.test(value);
}
