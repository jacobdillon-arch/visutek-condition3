export type PlanName = 'free' | 'starter' | 'pro';

export interface PlanLimits {
  maxConfigs: number;
  maxModelsPerConfig: number;
  maxStorageMB: number;
  removeBranding: boolean;
  shopifyBilling: boolean;
}

export const PLANS: Record<PlanName, PlanLimits> = {
  free: {
    maxConfigs: 1,
    maxModelsPerConfig: 2,
    maxStorageMB: 100,
    removeBranding: false,
    shopifyBilling: false,
  },
  starter: {
    maxConfigs: 3,
    maxModelsPerConfig: 4,
    maxStorageMB: 500,
    removeBranding: false,
    shopifyBilling: true,
  },
  pro: {
    maxConfigs: Infinity,
    maxModelsPerConfig: 10,
    maxStorageMB: 5000,
    removeBranding: true,
    shopifyBilling: true,
  },
};

export const PLAN_PRICES: Record<Exclude<PlanName, 'free'>, number> = {
  starter: 49,
  pro: 149,
};
