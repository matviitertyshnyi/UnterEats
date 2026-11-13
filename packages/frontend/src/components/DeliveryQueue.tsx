import {
  Bike,
  Car,
  CheckCircle2,
  CloudRain,
  CloudSnow,
  Footprints,
  Leaf,
  Package,
  Store,
  Sun,
  Trash2,
  Zap,
} from 'lucide-react';
import type { Courier, Delivery, DeliveryStatus, VehicleType } from '../types';

interface DeliveryQueueProps {
  deliveries: Delivery[];
  couriers: Courier[];
  statusFilter: string;
  loading: boolean;
  onFilterChange: (status: string) => void;
  onAssignCourier: (deliveryId: number, courierId: number | null) => void;
  onAdvanceStatus: (deliveryId: number, nextStatus: DeliveryStatus) => void;
  onDelete: (deliveryId: number) => void;
}

const FILTERS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'delivered', label: 'Delivered' },
];

const STATUS_BADGE: Record<DeliveryStatus, string> = {
  pending: 'bg-[#F3EFE8] text-[#57534E]',
  assigned: 'bg-amber-50 text-[#B45309]',
  in_transit: 'bg-orange-50 text-[#C2410C]',
  delivered: 'bg-emerald-50 text-[#15803D]',
  cancelled: 'bg-stone-100 text-stone-500',
};

const NEXT_STATUS: Partial<Record<DeliveryStatus, { status: DeliveryStatus; label: string }>> = {
  pending: { status: 'in_transit', label: 'Dispatch' },
  assigned: { status: 'in_transit', label: 'Start Transit' },
  in_transit: { status: 'delivered', label: 'Mark Delivered' },
};

function VehicleIcon({ vehicle }: { vehicle: VehicleType | null }) {
  if (vehicle === 'foot') return <Footprints className="h-3.5 w-3.5" aria-hidden="true" />;
  if (vehicle === 'car') return <Car className="h-3.5 w-3.5" aria-hidden="true" />;
  return <Bike className="h-3.5 w-3.5" aria-hidden="true" />;
}

function WeatherIcon({ weather }: { weather: Delivery['weather'] }) {
  if (weather === 'rain') return <CloudRain className="h-3.5 w-3.5 text-sky-700" aria-hidden="true" />;
  if (weather === 'snow') return <CloudSnow className="h-3.5 w-3.5 text-sky-600" aria-hidden="true" />;
  return <Sun className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />;
}

export function DeliveryQueue({
  deliveries,
  couriers,
  statusFilter,
  loading,
  onFilterChange,
  onAssignCourier,
  onAdvanceStatus,
  onDelete,
}: DeliveryQueueProps) {
  const availableCouriers = couriers.filter((c) => c.is_available);

  return (
    <section
      aria-label="Active Dispatch Queue"
      className="rounded-xl border border-[#E7E2DA] bg-white shadow-[0_1px_2px_rgba(28,25,23,0.04)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E7E2DA] px-5 py-4">
        <h2 className="text-base font-semibold tracking-tight text-[#1C1917]">
          Dispatch Queue
        </h2>

        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Filter deliveries by status">
          {FILTERS.map((f) => {
            const active = statusFilter === f.value;
            return (
              <button
                key={f.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onFilterChange(f.value)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-[#1C1917] text-white'
                    : 'text-[#57534E] hover:bg-[#F3EFE8] hover:text-[#1C1917]'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="px-5 py-12 text-center text-sm text-[#57534E]">
          Loading local deliveries...
        </div>
      ) : deliveries.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <Package className="mx-auto h-7 w-7 text-[#A8A29E]" aria-hidden="true" />
          <p className="mt-2 text-sm font-medium text-[#1C1917]">No deliveries in this view</p>
          <p className="mt-1 text-xs text-[#57534E]">
            Create a new order or ask the AI Dispatch Assistant to draft one.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[#E7E2DA]">
          {deliveries.map((d) => {
            const nextAction = NEXT_STATUS[d.status];
            return (
              <li
                key={d.id}
                className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-[#FAF8F4]/60 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono-data text-xs text-[#78716C]">#{d.id}</span>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#1C1917]">
                      <Store className="h-3.5 w-3.5 text-[#57534E]" aria-hidden="true" />
                      {d.business_name ?? `Shop #${d.business_id}`}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${STATUS_BADGE[d.status]}`}
                    >
                      {d.status.replace('_', ' ')}
                    </span>
                    {d.urgency === 'express' && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100/80 px-2 py-0.5 text-[11px] font-medium text-[#9A3412]">
                        <Zap className="h-3 w-3" aria-hidden="true" />
                        Express
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-[#44403C]">
                    To <span className="font-medium text-[#1C1917]">{d.customer_name}</span> ·{' '}
                    {d.dropoff_address}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#57534E]">
                    <span className="inline-flex items-center gap-1 font-mono-data">
                      <VehicleIcon vehicle={d.courier_vehicle ?? d.recommended_mode} />
                      {d.distance_km.toFixed(1)} km · {d.eta_minutes ?? '--'} min
                    </span>
                    <span className="inline-flex items-center gap-1 capitalize">
                      <WeatherIcon weather={d.weather} />
                      {d.weather}
                    </span>
                    <span className="capitalize">{d.package_type.replace('_', ' ')}</span>
                    <span className="inline-flex items-center gap-1 font-mono-data text-[#15803D]">
                      <Leaf className="h-3 w-3" aria-hidden="true" />
                      {d.co2_saved_g}g CO₂ saved
                    </span>
                  </div>

                  {d.notes && (
                    <p className="text-xs italic text-[#78716C]">Note: {d.notes}</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                  <select
                    aria-label={`Assign courier for order #${d.id}`}
                    value={d.courier_id ?? ''}
                    disabled={d.status === 'delivered' || d.status === 'cancelled'}
                    onChange={(e) => {
                      const val = e.target.value;
                      onAssignCourier(d.id, val ? Number(val) : null);
                    }}
                    className="rounded-lg border border-[#E7E2DA] bg-[#FAF8F4] px-2.5 py-1.5 text-xs text-[#1C1917] focus:border-[#C2410C] focus:outline-none disabled:opacity-50"
                  >
                    <option value="">Unassigned</option>
                    {couriers.map((c) => (
                      <option
                        key={c.id}
                        value={c.id}
                        disabled={!c.is_available && c.id !== d.courier_id}
                      >
                        {c.name} ({c.vehicle_type.replace('_', ' ')})
                        {!c.is_available && c.id !== d.courier_id ? ' — offline' : ''}
                      </option>
                    ))}
                    {availableCouriers.length === 0 && !d.courier_id && (
                      <option disabled>No couriers online</option>
                    )}
                  </select>

                  {nextAction && (
                    <button
                      type="button"
                      onClick={() => onAdvanceStatus(d.id, nextAction.status)}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#1C1917] px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#44403C]"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      {nextAction.label}
                    </button>
                  )}

                  <button
                    type="button"
                    aria-label={`Delete order #${d.id}`}
                    onClick={() => onDelete(d.id)}
                    className="rounded-lg border border-[#E7E2DA] p-1.5 text-[#78716C] transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
