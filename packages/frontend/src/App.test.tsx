import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { api } from './api/client';

vi.mock('./api/client', () => ({
  api: {
    getBusinesses: vi.fn(),
    getCouriers: vi.fn(),
    getDeliveries: vi.fn(),
    createBusiness: vi.fn(),
    createCourier: vi.fn(),
    toggleCourier: vi.fn(),
    createDelivery: vi.fn(),
    updateDelivery: vi.fn(),
    deleteDelivery: vi.fn(),
    adviseDispatch: vi.fn(),
  },
}));

describe('App', () => {
  beforeEach(() => {
    vi.mocked(api.getBusinesses).mockResolvedValue([
      {
        id: 1,
        name: 'Bella Napoli Pizzeria',
        category: 'pizzeria',
        address: '14 Market St',
        created_at: '2026-11-13T00:00:00.000Z',
      },
    ]);
    vi.mocked(api.getCouriers).mockResolvedValue([
      {
        id: 1,
        name: 'Elena R.',
        vehicle_type: 'ebike',
        is_available: true,
        max_weight_kg: 15,
        weather_protected: false,
        co2_g_per_km: 8,
      },
    ]);
    vi.mocked(api.getDeliveries).mockResolvedValue([
      {
        id: 101,
        business_id: 1,
        business_name: 'Bella Napoli Pizzeria',
        business_category: 'pizzeria',
        courier_id: 1,
        courier_name: 'Elena R.',
        courier_vehicle: 'ebike',
        customer_name: 'Anna Kowalska',
        dropoff_address: '220 River Rd',
        distance_km: 2.4,
        package_type: 'hot_food',
        urgency: 'express',
        weather: 'clear',
        status: 'in_transit',
        recommended_mode: 'ebike',
        eta_minutes: 12,
        co2_saved_g: 389,
        notes: 'Thermal bag',
        created_at: '2026-11-13T00:00:00.000Z',
      },
    ]);
  });

  it('renders dispatch queue and AI assistant after loading', async () => {
    render(<App />);

    expect(screen.getByText('UnterEats')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Anna Kowalska')).toBeInTheDocument();
    });

    expect(screen.getByText('AI Dispatch Assistant')).toBeInTheDocument();
    expect(screen.getByText('Dispatch Queue')).toBeInTheDocument();
  });
});
