import * as Crypto from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';

const PHOTOS_DIR_NAME = 'photos';

/**
 * A tiny hardcoded 1x1 JPEG, used only by the "Buat contoh data lama" demo
 * seeding action so the retention feature has a real file to delete.
 */
const DEMO_PHOTO_BASE64 =
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';

/** Resolves (and lazily creates) the `photos/` subdirectory of the app's document directory. */
function getPhotosDirectory(): Directory {
  const directory = new Directory(Paths.document, PHOTOS_DIR_NAME);
  if (!directory.exists) {
    directory.create({ intermediates: true, idempotent: true });
  }
  return directory;
}

/**
 * Copies a picked/captured asset (camera roll or cache URI) into the app's
 * `photos/` directory so it survives cache purges. Returns the persisted
 * file's URI.
 */
export async function persistPhotoFromUri(sourceUri: string): Promise<string> {
  const extension = sourceUri.split('.').pop() ?? 'jpg';
  const sourceFile = new File(sourceUri);
  const destination = new File(getPhotosDirectory(), `${Crypto.randomUUID()}.${extension}`);
  await sourceFile.copy(destination);
  return destination.uri;
}

/** Reads a photo file's contents as base64, or `null` if there is no photo / it can't be read. */
export async function readPhotoBase64(photoUri: string | null): Promise<string | null> {
  if (!photoUri) {
    return null;
  }
  try {
    return await new File(photoUri).base64();
  } catch {
    return null;
  }
}

/** Deletes a single photo file. Ignores a missing file instead of throwing. */
export function deletePhotoFile(photoUri: string | null): void {
  if (!photoUri) {
    return;
  }
  try {
    const file = new File(photoUri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // Missing/unreadable file: nothing to clean up.
  }
}

/** Size, in bytes, of a single photo file. Returns 0 if it does not exist or can't be read. */
export function getPhotoFileSizeBytes(photoUri: string | null): number {
  if (!photoUri) {
    return 0;
  }
  try {
    const file = new File(photoUri);
    return file.exists ? file.size : 0;
  } catch {
    return 0;
  }
}

/** Total size, in bytes, of everything stored in the `photos/` directory. */
export function getPhotosDirSizeBytes(): number {
  try {
    const directory = getPhotosDirectory();
    return directory.exists ? (directory.size ?? 0) : 0;
  } catch {
    return 0;
  }
}

/** Deletes every file in the `photos/` directory, then recreates it empty. */
export function clearPhotosDir(): void {
  try {
    const directory = getPhotosDirectory();
    if (directory.exists) {
      directory.delete();
    }
  } catch {
    // Nothing to clear.
  } finally {
    getPhotosDirectory();
  }
}

/**
 * Writes the hardcoded demo JPEG into the `photos/` directory and returns its
 * URI. Used only by the "Buat contoh data lama" Pengaturan action so the
 * retention acceptance test has a real file on disk to delete.
 */
export function writeDemoPhoto(): string {
  const file = new File(getPhotosDirectory(), `${Crypto.randomUUID()}.jpg`);
  file.write(DEMO_PHOTO_BASE64, { encoding: 'base64' });
  return file.uri;
}
