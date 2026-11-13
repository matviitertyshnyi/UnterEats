import type {
  Business,
  BusinessCategory,
  Courier,
  CreateDeliveryPayload,
  Delivery,
  DeliveryStatus,
  DispatchAdvice,
  VehicleType,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // ignore non-JSON error body
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  getBusinesses: () => request<Business[]>('/businesses'),
  createBusiness: (payload: { name: string; category: BusinessCategory; address: string }) =>
    request<Business>('/businesses', { method: 'POST', body: JSON.stringify(payload) }),

  getCouriers: () => request<Courier[]>('/couriers'),
  createCourier: (payload: {
    name: string;
    vehicle_type: VehicleType;
    max_weight_kg: number;
    weather_protected: boolean;
    co2_g_per_km: number;
  }) => request<Courier>('/couriers', { method: 'POST', body: JSON.stringify(payload) }),
  toggleCourier: (id: number, is_available: boolean) =>
    request<Courier>(`/couriers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_available }),
    }),

  getDeliveries: (status?: string) =>
    request<Delivery[]>(status && status !== 'all' ? `/deliveries?status=${encodeURIComponent(status)}` : '/deliveries'),
  createDelivery: (payload: CreateDeliveryPayload) =>
    request<Delivery>('/deliveries', { method: 'POST', body: JSON.stringify(payload) }),
  updateDelivery: (
    id: number,
    payload: { status?: DeliveryStatus; courier_id?: number | null; notes?: string | null },
  ) =>
    request<Delivery>(`/deliveries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteDelivery: (id: number) => request<void>(`/deliveries/${id}`, { method: 'DELETE' }),

  adviseDispatch: (prompt: string) =>
    request<DispatchAdvice>('/dispatch/advise', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }),
};
