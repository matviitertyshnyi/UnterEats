import { useEffect, useState } from 'react';
import { Plus, Store, Users } from 'lucide-react';
import type {
  Business,
  BusinessCategory,
  Courier,
  CreateDeliveryPayload,
  DispatchAdvice,
  PackageType,
  UrgencyLevel,
  WeatherCondition,
} from '../types';

interface DispatchRailTabsProps {
  businesses: Business[];
  couriers: Courier[];
  prefillAdvice: DispatchAdvice | null;
  onCreateDelivery: (payload: CreateDeliveryPayload) => Promise<void>;
  onToggleCourier: (id: number, available: boolean) => Promise<void>;
  onCreateBusiness: (payload: {
    name: string;
    category: BusinessCategory;
    address: string;
  }) => Promise<void>;
}

export function DispatchRailTabs({
  businesses,
  couriers,
  prefillAdvice,
  onCreateDelivery,
  onToggleCourier,
  onCreateBusiness,
}: DispatchRailTabsProps) {
  const [tab, setTab] = useState<'order' | 'fleet'>('order');

  const [businessId, setBusinessId] = useState<number>(businesses[0]?.id ?? 1);
  const [courierId, setCourierId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [distanceKm, setDistanceKm] = useState('2.2');
  const [packageType, setPackageType] = useState<PackageType>('hot_food');
  const [urgency, setUrgency] = useState<UrgencyLevel>('standard');
  const [weather, setWeather] = useState<WeatherCondition>('clear');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [shopName, setShopName] = useState('');
  const [shopCategory, setShopCategory] = useState<BusinessCategory>('pizzeria');
  const [shopAddress, setShopAddress] = useState('');

  useEffect(() => {
    if (businesses.length > 0 && !businesses.some((b) => b.id === businessId)) {
      setBusinessId(businesses[0].id);
    }
  }, [businesses, businessId]);

  useEffect(() => {
    if (!prefillAdvice) return;
    setTab('order');
    setPackageType(prefillAdvice.suggestedOrder.packageType);
    setUrgency(prefillAdvice.suggestedOrder.urgency);
    setWeather(prefillAdvice.suggestedOrder.weather);
    setDistanceKm(String(prefillAdvice.suggestedOrder.distanceKm));
    setNotes(prefillAdvice.suggestedOrder.notes);
    setCourierId(prefillAdvice.matchedCourierId ? String(prefillAdvice.matchedCourierId) : '');
  }, [prefillAdvice]);

  async function handleOrderSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerName.trim() || !dropoffAddress.trim()) return;
    setSubmitting(true);
    try {
      await onCreateDelivery({
        business_id: businessId,
        courier_id: courierId ? Number(courierId) : null,
        customer_name: customerName.trim(),
        dropoff_address: dropoffAddress.trim(),
        distance_km: Math.max(0.2, parseFloat(distanceKm) || 1.5),
        package_type: packageType,
        urgency,
        weather,
        notes: notes.trim() || null,
      });
      setCustomerName('');
      setDropoffAddress('');
      setNotes('');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleShopSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!shopName.trim() || !shopAddress.trim()) return;
    await onCreateBusiness({
      name: shopName.trim(),
      category: shopCategory,
      address: shopAddress.trim(),
    });
    setShopName('');
    setShopAddress('');
  }

  return (
    <section
      aria-label="Order Creation and Fleet Management"
      className="rounded-xl border border-[#E7E2DA] bg-white shadow-[0_1px_2px_rgba(28,25,23,0.04)]"
    >
      <div className="grid grid-cols-2 border-b border-[#E7E2DA]">
        <button
          type="button"
          onClick={() => setTab('order')}
          className={`flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors ${
            tab === 'order'
              ? 'border-b-2 border-[#C2410C] text-[#1C1917]'
              : 'text-[#57534E] hover:text-[#1C1917]'
          }`}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          New Delivery
        </button>
        <button
          type="button"
          onClick={() => setTab('fleet')}
          className={`flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors ${
            tab === 'fleet'
              ? 'border-b-2 border-[#C2410C] text-[#1C1917]'
              : 'text-[#57534E] hover:text-[#1C1917]'
          }`}
        >
          <Users className="h-3.5 w-3.5" aria-hidden="true" />
          Fleet & Shops
        </button>
      </div>

      {tab === 'order' ? (
        <form onSubmit={handleOrderSubmit} className="space-y-3 p-5">
          <div>
            <label className="block text-xs font-medium text-[#57534E]">Local Business</label>
            <select
              value={businessId}
              onChange={(e) => setBusinessId(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-[#E7E2DA] bg-[#FAF8F4] px-3 py-1.5 text-sm text-[#1C1917] focus:border-[#C2410C] focus:outline-none"
            >
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.category})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-medium text-[#57534E]">Customer</label>
              <input
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Jane Doe"
                className="mt-1 w-full rounded-lg border border-[#E7E2DA] bg-[#FAF8F4] px-3 py-1.5 text-sm text-[#1C1917] focus:border-[#C2410C] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#57534E]">Distance (km)</label>
              <input
                required
                type="number"
                step="0.1"
                min="0.2"
                max="50"
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#E7E2DA] bg-[#FAF8F4] px-3 py-1.5 font-mono-data text-sm text-[#1C1917] focus:border-[#C2410C] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#57534E]">Dropoff Address</label>
            <input
              required
              value={dropoffAddress}
              onChange={(e) => setDropoffAddress(e.target.value)}
              placeholder="128 Maple St, Apt 4"
              className="mt-1 w-full rounded-lg border border-[#E7E2DA] bg-[#FAF8F4] px-3 py-1.5 text-sm text-[#1C1917] focus:border-[#C2410C] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-[#57534E]">Package</label>
              <select
                value={packageType}
                onChange={(e) => setPackageType(e.target.value as PackageType)}
                className="mt-1 w-full rounded-lg border border-[#E7E2DA] bg-[#FAF8F4] px-2 py-1.5 text-xs text-[#1C1917] focus:border-[#C2410C] focus:outline-none"
              >
                <option value="hot_food">Hot Food</option>
                <option value="fragile_flowers">Flowers</option>
                <option value="bakery">Bakery</option>
                <option value="pharmacy">Pharmacy</option>
                <option value="general">General</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#57534E]">Urgency</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
                className="mt-1 w-full rounded-lg border border-[#E7E2DA] bg-[#FAF8F4] px-2 py-1.5 text-xs text-[#1C1917] focus:border-[#C2410C] focus:outline-none"
              >
                <option value="standard">Standard</option>
                <option value="express">Express</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#57534E]">Weather</label>
              <select
                value={weather}
                onChange={(e) => setWeather(e.target.value as WeatherCondition)}
                className="mt-1 w-full rounded-lg border border-[#E7E2DA] bg-[#FAF8F4] px-2 py-1.5 text-xs text-[#1C1917] focus:border-[#C2410C] focus:outline-none"
              >
                <option value="clear">Clear</option>
                <option value="rain">Rain</option>
                <option value="snow">Snow</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#57534E]">Assign Courier (optional)</label>
            <select
              value={courierId}
              onChange={(e) => setCourierId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#E7E2DA] bg-[#FAF8F4] px-3 py-1.5 text-xs text-[#1C1917] focus:border-[#C2410C] focus:outline-none"
            >
              <option value="">Leave pending</option>
              {couriers
                .filter((c) => c.is_available)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.vehicle_type.replace('_', ' ')})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#57534E]">Handling Notes</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Thermal bag, keep upright..."
              className="mt-1 w-full rounded-lg border border-[#E7E2DA] bg-[#FAF8F4] px-3 py-1.5 text-xs text-[#1C1917] focus:border-[#C2410C] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-[#1C1917] px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#44403C] disabled:opacity-50"
          >
            {submitting ? 'Creating Order...' : 'Create Delivery Order'}
          </button>
        </form>
      ) : (
        <div className="space-y-5 p-5">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[#57534E]">
              Couriers
            </h3>
            <ul className="mt-2 divide-y divide-[#E7E2DA] rounded-lg border border-[#E7E2DA]">
              {couriers.map((c) => (
                <li key={c.id} className="flex items-center justify-between px-3 py-2 text-xs">
                  <div>
                    <span className="font-medium text-[#1C1917]">{c.name}</span>
                    <span className="ml-1.5 text-[#57534E]">
                      ({c.vehicle_type.replace('_', ' ')})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void onToggleCourier(c.id, !c.is_available)}
                    className={`rounded-full px-2.5 py-0.5 font-medium transition-colors ${
                      c.is_available
                        ? 'bg-emerald-50 text-[#15803D] hover:bg-emerald-100'
                        : 'bg-stone-100 text-[#57534E] hover:bg-stone-200'
                    }`}
                  >
                    {c.is_available ? 'Online' : 'Offline'}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <form onSubmit={handleShopSubmit} className="space-y-2 border-t border-[#E7E2DA] pt-4">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#57534E]">
              <Store className="h-3.5 w-3.5" aria-hidden="true" />
              Add Local Shop
            </h3>
            <input
              required
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="Shop name (e.g. Corner Gelato)"
              className="w-full rounded-lg border border-[#E7E2DA] bg-[#FAF8F4] px-3 py-1.5 text-xs text-[#1C1917] focus:border-[#C2410C] focus:outline-none"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={shopCategory}
                onChange={(e) => setShopCategory(e.target.value as BusinessCategory)}
                className="rounded-lg border border-[#E7E2DA] bg-[#FAF8F4] px-2 py-1.5 text-xs text-[#1C1917] focus:border-[#C2410C] focus:outline-none"
              >
                <option value="pizzeria">Pizzeria</option>
                <option value="florist">Florist</option>
                <option value="bakery">Bakery</option>
                <option value="pharmacy">Pharmacy</option>
                <option value="grocery">Grocery</option>
              </select>
              <input
                required
                value={shopAddress}
                onChange={(e) => setShopAddress(e.target.value)}
                placeholder="Street address"
                className="rounded-lg border border-[#E7E2DA] bg-[#FAF8F4] px-2.5 py-1.5 text-xs text-[#1C1917] focus:border-[#C2410C] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg border border-[#E7E2DA] bg-[#FAF8F4] px-3 py-1.5 text-xs font-medium text-[#1C1917] transition-colors hover:bg-[#F3EFE8]"
            >
              Register Shop
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
