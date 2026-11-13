import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bike, Leaf, RefreshCw } from 'lucide-react';
import { api } from './api/client';
import { AiDispatchPanel } from './components/AiDispatchPanel';
import { DeliveryQueue } from './components/DeliveryQueue';
import { DispatchRailTabs } from './components/DispatchRailTabs';
import type {
  Business,
  BusinessCategory,
  Courier,
  CreateDeliveryPayload,
  Delivery,
  DeliveryStatus,
  DispatchAdvice,
} from './types';

export function App() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prefillAdvice, setPrefillAdvice] = useState<DispatchAdvice | null>(null);

  const loadAll = useCallback(async (filter: string) => {
    setLoading(true);
    setError(null);
    try {
      const [bizList, courierList, deliveryList] = await Promise.all([
        api.getBusinesses(),
        api.getCouriers(),
        api.getDeliveries(filter),
      ]);
      setBusinesses(bizList);
      setCouriers(courierList);
      setDeliveries(deliveryList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dispatch data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll(statusFilter);
  }, [loadAll, statusFilter]);

  const stats = useMemo(() => {
    const active = deliveries.filter(
      (d) => d.status !== 'delivered' && d.status !== 'cancelled',
    ).length;
    const onlineCouriers = couriers.filter((c) => c.is_available).length;
    const totalCo2Kg = (
      deliveries.reduce((acc, d) => acc + d.co2_saved_g, 0) / 1000
    ).toFixed(2);
    return { active, onlineCouriers, totalCo2Kg };
  }, [deliveries, couriers]);

  async function handleAssignCourier(deliveryId: number, courierId: number | null) {
    const updated = await api.updateDelivery(deliveryId, { courier_id: courierId });
    setDeliveries((prev) => prev.map((d) => (d.id === deliveryId ? updated : d)));
  }

  async function handleAdvanceStatus(deliveryId: number, nextStatus: DeliveryStatus) {
    const updated = await api.updateDelivery(deliveryId, { status: nextStatus });
    setDeliveries((prev) => prev.map((d) => (d.id === deliveryId ? updated : d)));
  }

  async function handleDelete(deliveryId: number) {
    await api.deleteDelivery(deliveryId);
    setDeliveries((prev) => prev.filter((d) => d.id !== deliveryId));
  }

  async function handleCreateDelivery(payload: CreateDeliveryPayload) {
    const created = await api.createDelivery(payload);
    setDeliveries((prev) => [created, ...prev]);
  }

  async function handleToggleCourier(id: number, available: boolean) {
    const updated = await api.toggleCourier(id, available);
    setCouriers((prev) => prev.map((c) => (c.id === id ? updated : c)));
  }

  async function handleCreateBusiness(payload: {
    name: string;
    category: BusinessCategory;
    address: string;
  }) {
    const created = await api.createBusiness(payload);
    setBusinesses((prev) => [...prev, created]);
  }

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#1C1917]">
      <header className="border-b border-[#E7E2DA] bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#C2410C] text-white">
              <Bike className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-[#1C1917]">UnterEats</h1>
              <p className="text-xs text-[#57534E]">
                Local-business last-mile delivery & AI dispatch
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[#57534E]">
            <div>
              Active orders:{' '}
              <span className="font-mono-data font-semibold text-[#1C1917]">{stats.active}</span>
            </div>
            <div>
              Couriers online:{' '}
              <span className="font-mono-data font-semibold text-[#1C1917]">
                {stats.onlineCouriers}/{couriers.length}
              </span>
            </div>
            <div className="inline-flex items-center gap-1 text-[#15803D]">
              <Leaf className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="font-mono-data font-semibold">{stats.totalCo2Kg} kg</span> CO₂ saved
            </div>
            <button
              type="button"
              onClick={() => void loadAll(statusFilter)}
              className="inline-flex items-center gap-1 rounded-lg border border-[#E7E2DA] px-2.5 py-1 text-xs font-medium text-[#1C1917] transition-colors hover:bg-[#FAF8F4]"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {error && (
          <div
            role="alert"
            className="mb-5 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void loadAll(statusFilter)}
              className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-red-800 shadow-xs hover:bg-red-100"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <DeliveryQueue
              deliveries={deliveries}
              couriers={couriers}
              statusFilter={statusFilter}
              loading={loading}
              onFilterChange={setStatusFilter}
              onAssignCourier={(id, cId) => void handleAssignCourier(id, cId)}
              onAdvanceStatus={(id, next) => void handleAdvanceStatus(id, next)}
              onDelete={(id) => void handleDelete(id)}
            />
          </div>

          <aside className="space-y-6 lg:col-span-4">
            <AiDispatchPanel onApplyAdvice={setPrefillAdvice} />
            <DispatchRailTabs
              businesses={businesses}
              couriers={couriers}
              prefillAdvice={prefillAdvice}
              onCreateDelivery={handleCreateDelivery}
              onToggleCourier={handleToggleCourier}
              onCreateBusiness={handleCreateBusiness}
            />
          </aside>
        </div>
      </main>
    </div>
  );
}

export default App;
