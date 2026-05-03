import type { ViewerPayload } from '@visutek/shared';

declare global {
  interface Window {
    __VISUTEK_CONFIG__: ViewerPayload;
    THREE: typeof import('three');
  }
}

export type { ViewerPayload };
