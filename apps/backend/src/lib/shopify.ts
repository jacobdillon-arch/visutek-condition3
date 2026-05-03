import '@shopify/shopify-api/adapters/node';
import { shopifyApi, ApiVersion, Session } from '@shopify/shopify-api';
import { db } from './db';
import { encrypt, decrypt } from './encrypt';

export const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  scopes: ['read_products', 'write_products', 'read_orders'],
  hostName: process.env.HOST!.replace(/^https?:\/\//, ''),
  apiVersion: ApiVersion.April24,
  isEmbeddedApp: false,
});

/** Persist a Shopify session to the database (access token encrypted at rest) */
export async function saveSession(session: Session): Promise<void> {
  const encryptedToken = encrypt(session.accessToken!);
  await db.store.upsert({
    where: { shopifyDomain: session.shop },
    create: {
      shopifyDomain: session.shop,
      accessToken: encryptedToken,
    },
    update: {
      accessToken: encryptedToken,
      uninstalledAt: null,
    },
  });
}

/** Load a Shopify session from the database */
export async function loadSession(shop: string): Promise<Session | null> {
  const store = await db.store.findUnique({ where: { shopifyDomain: shop } });
  if (!store?.accessToken) return null;

  const session = new Session({
    id: `offline_${shop}`,
    shop,
    state: '',
    isOnline: false,
  });
  session.accessToken = decrypt(store.accessToken);
  return session;
}

/** Get a Shopify Admin API REST client for a given shop */
export async function getAdminClient(shop: string) {
  const session = await loadSession(shop);
  if (!session) throw new Error(`No session for ${shop}`);
  return new shopify.clients.Rest({ session });
}

/** Get a Shopify Admin GraphQL client */
export async function getGraphQLClient(shop: string) {
  const session = await loadSession(shop);
  if (!session) throw new Error(`No session for ${shop}`);
  return new shopify.clients.Graphql({ session });
}

/** Fetch all variants for a product from Shopify Admin API */
export async function getProductVariants(shop: string, productId: string) {
  const client = await getAdminClient(shop);
  const response = await client.get({
    path: `products/${productId}/variants`,
    query: { limit: '250' },
  }) as { body: { variants: Array<{ id: number; title: string; price: string; sku: string }> } };
  return response.body.variants;
}
