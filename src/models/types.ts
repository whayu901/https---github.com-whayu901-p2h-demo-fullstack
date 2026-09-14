import type {
  HasilItemP2H,
  InspectionDto,
  PesertaP5M,
  SafetyTalkDto,
  StatusKelayakan,
  SyncStatus,
} from '@p2h/shared';

/**
 * Device-local shape of a P2H inspection: same fields as `InspectionDto` from
 * `@p2h/shared` minus the base64 photo payload (replaced by a local file URI),
 * plus the computed verdict and sync bookkeeping that only exist on-device.
 */
export interface LocalInspection extends Omit<InspectionDto, 'fotoBase64'> {
  fotoUri: string | null;
  statusKelayakan: StatusKelayakan;
  syncStatus: SyncStatus;
  /** ISO 8601 timestamp set when this record was marked SYNCED, else `null`. */
  syncedAt: string | null;
}

/**
 * Device-local shape of a P5M safety talk: same fields as `SafetyTalkDto` from
 * `@p2h/shared` minus the base64 photo payload, plus sync bookkeeping.
 */
export interface LocalSafetyTalk extends Omit<SafetyTalkDto, 'fotoBase64'> {
  fotoUri: string | null;
  syncStatus: SyncStatus;
  /** ISO 8601 timestamp set when this record was marked SYNCED, else `null`. */
  syncedAt: string | null;
}

export type { HasilItemP2H, PesertaP5M };
