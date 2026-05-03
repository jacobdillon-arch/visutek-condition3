// ─── Store ─────────────────────────────────────────────────────────────────

export interface Store {
  id: string;
  shopifyDomain: string;
  plan: PlanName;
  installedAt: Date;
  uninstalledAt: Date | null;
}

// ─── Viewer Config ─────────────────────────────────────────────────────────

export interface ViewerConfig {
  id: string;
  storeId: string;
  shopifyProductId: string | null;
  name: string;
  active: boolean;
  showBranding: boolean;
  backgroundColor: string;
  createdAt: Date;
  models: Model[];
  colorOptions: ColorOption[];
  sizeCharts: SizeChart[];
}

// ─── Models ────────────────────────────────────────────────────────────────

export type ModelUploadStatus = 'pending' | 'processing' | 'ready' | 'error';

export interface Model {
  id: string;
  configId: string;
  label: string;
  s3Key: string;
  fileSizeBytes: number;
  uploadStatus: ModelUploadStatus;
  /** Presigned URL — only present in viewer responses, never persisted */
  presignedUrl?: string;
  createdAt: Date;
}

// ─── Colors ────────────────────────────────────────────────────────────────

export interface ColorOption {
  id: string;
  configId: string;
  name: string;
  hexValue: string;
  sortOrder: number;
  isDefault: boolean;
}

// ─── Size Charts ───────────────────────────────────────────────────────────

export type Gender = 'mens' | 'womens' | 'unisex';
export type MeasurementUnit = 'in' | 'cm';

export interface SizeEntry {
  waist: [number, number];
  hip: [number, number];
  inseam: {
    short: number;
    reg: number;
    tall: number;
  };
}

export type SizeChartData = Record<string, SizeEntry>;

export interface EaseData {
  waist: number;
  hip: number;
}

export interface SizeChart {
  id: string;
  configId: string;
  label: string;
  gender: Gender;
  unit: MeasurementUnit;
  chartData: SizeChartData;
  easeData: EaseData;
}

// ─── Variant Mappings ──────────────────────────────────────────────────────

export interface VariantMapping {
  id: string;
  configId: string;
  shopifyVariantId: string;
  size: string;
  colorOptionId: string | null;
  priceOverride: number | null;
}

// ─── Viewer Payload (sent to iframe) ──────────────────────────────────────

export interface ViewerPayload {
  configId: string;
  backgroundColor: string;
  showBranding: boolean;
  models: Array<{
    id: string;
    label: string;
    presignedUrl: string;
  }>;
  colorOptions: ColorOption[];
  sizeCharts: SizeChart[];
  variantMappings: VariantMapping[];
}

// ─── API Shapes ────────────────────────────────────────────────────────────

export interface CreateConfigInput {
  name: string;
  shopifyProductId?: string;
  backgroundColor?: string;
}

export interface UpdateConfigInput {
  name?: string;
  shopifyProductId?: string;
  active?: boolean;
  backgroundColor?: string;
  showBranding?: boolean;
}

export interface CreateColorInput {
  name: string;
  hexValue: string;
  isDefault?: boolean;
}

export interface CreateSizeChartInput {
  label: string;
  gender: Gender;
  unit: MeasurementUnit;
  chartData: SizeChartData;
  easeData: EaseData;
}

export interface UploadModelInput {
  configId: string;
  label: string;
}

export interface UploadPresignResponse {
  uploadUrl: string;
  modelId: string;
  s3Key: string;
}

// ─── Auth ──────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  storeId: string | null;
}

// ─── postMessage bridge (viewer ↔ Shopify parent) ─────────────────────────

export type CartBridgeMessage =
  | { action: 'visutek:add_to_cart'; variantId: string; quantity: number }
  | { action: 'visutek:ready' }
  | { action: 'visutek:resize'; height: number };
