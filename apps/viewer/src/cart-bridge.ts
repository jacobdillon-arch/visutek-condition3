import type { CartBridgeMessage } from '@visutek/shared';

export function addToCart(variantId: string, quantity = 1): void {
  const msg: CartBridgeMessage = { action: 'visutek:add_to_cart', variantId, quantity };
  window.parent.postMessage(msg, '*');
}

export function notifyReady(): void {
  const msg: CartBridgeMessage = { action: 'visutek:ready' };
  window.parent.postMessage(msg, '*');
}

export function notifyResize(height: number): void {
  const msg: CartBridgeMessage = { action: 'visutek:resize', height };
  window.parent.postMessage(msg, '*');
}
