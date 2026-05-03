const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  // Auth
  register: (data: { email: string; password: string; name?: string }) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request<{ id: string; email: string; name: string | null; storeId: string | null }>('/auth/me'),

  // Configs
  getConfigs: () => request<any[]>('/api/configs'),
  createConfig: (data: { name: string; shopifyProductId?: string; backgroundColor?: string }) =>
    request('/api/configs', { method: 'POST', body: JSON.stringify(data) }),
  getConfig: (id: string) => request<any>(`/api/configs/${id}`),
  updateConfig: (id: string, data: Record<string, unknown>) =>
    request(`/api/configs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteConfig: (id: string) => request(`/api/configs/${id}`, { method: 'DELETE' }),

  // Colors
  getColors: (configId: string) => request<any[]>(`/api/configs/${configId}/colors`),
  createColor: (configId: string, data: { name: string; hexValue: string; isDefault?: boolean }) =>
    request(`/api/configs/${configId}/colors`, { method: 'POST', body: JSON.stringify(data) }),
  updateColors: (configId: string, colors: any[]) =>
    request(`/api/configs/${configId}/colors`, { method: 'PUT', body: JSON.stringify(colors) }),
  deleteColor: (configId: string, colorId: string) =>
    request(`/api/configs/${configId}/colors/${colorId}`, { method: 'DELETE' }),

  // Size charts
  getSizeCharts: (configId: string) => request<any[]>(`/api/configs/${configId}/size-charts`),
  createSizeChart: (configId: string, data: any) =>
    request(`/api/configs/${configId}/size-charts`, { method: 'POST', body: JSON.stringify(data) }),
  updateSizeChart: (configId: string, chartId: string, data: any) =>
    request(`/api/configs/${configId}/size-charts/${chartId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSizeChart: (configId: string, chartId: string) =>
    request(`/api/configs/${configId}/size-charts/${chartId}`, { method: 'DELETE' }),

  // Variant mappings
  getVariants: (configId: string) => request<any[]>(`/api/configs/${configId}/variants`),
  updateVariants: (configId: string, mappings: any[]) =>
    request(`/api/configs/${configId}/variants`, { method: 'PUT', body: JSON.stringify(mappings) }),

  // Upload
  requestUpload: (data: { configId: string; label: string; fileSizeBytes: number }) =>
    request<{ uploadUrl: string; modelId: string; s3Key: string; warnings: string[] }>('/api/upload/model', { method: 'POST', body: JSON.stringify(data) }),
  completeUpload: (modelId: string) =>
    request(`/api/upload/model/${modelId}/complete`, { method: 'POST' }),
  errorUpload: (modelId: string) =>
    request(`/api/upload/model/${modelId}/error`, { method: 'POST' }),
  deleteModel: (modelId: string) =>
    request(`/api/upload/model/${modelId}`, { method: 'DELETE' }),
};
