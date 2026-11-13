import { BusinessRepository } from '../repositories/businessRepo.js';
import { CourierRepository } from '../repositories/courierRepo.js';
import { DeliveryRepository } from '../repositories/deliveryRepo.js';
import type {
  Delivery,
  DeliveryStatus,
  PackageType,
  UrgencyLevel,
  VehicleType,
  WeatherCondition,
} from '../types/domain.js';

const CAR_BASELINE_CO2_PER_KM = 170;

const VEHICLE_CO2_PER_KM: Record<VehicleType, number> = {
  foot: 0,
  ebike: 8,
  cargo_bike: 10,
  scooter: 65,
  car: 170,
};

const VEHICLE_SPEED_KMH: Record<VehicleType, number> = {
  foot: 5,
  ebike: 20,
  cargo_bike: 17,
  scooter: 26,
  car: 24,
};

export function estimateEtaMinutes(
  distanceKm: number,
  vehicle: VehicleType,
  urgency: UrgencyLevel,
  weather: WeatherCondition,
): number {
  const speed = VEHICLE_SPEED_KMH[vehicle];
  const weatherFactor = weather === 'snow' ? 1.35 : weather === 'rain' ? 1.15 : 1.0;
  const handoffMin = urgency === 'express' ? 3 : 5;
  const travelMin = (distanceKm / speed) * 60 * weatherFactor;
  return Math.max(5, Math.round(travelMin + handoffMin));
}

export function calculateCo2SavedGrams(distanceKm: number, vehicle: VehicleType): number {
  const perKm = VEHICLE_CO2_PER_KM[vehicle];
  return Math.max(0, Math.round((CAR_BASELINE_CO2_PER_KM - perKm) * distanceKm));
}

export function pickBestVehicle(params: {
  distanceKm: number;
  packageType: PackageType;
  urgency: UrgencyLevel;
  weather: WeatherCondition;
}): VehicleType {
  const { distanceKm, packageType, urgency, weather } = params;
  const harshWeather = weather === 'rain' || weather === 'snow';

  if (distanceKm <= 0.9 && !harshWeather && packageType !== 'fragile_flowers') {
    return 'foot';
  }
  if (packageType === 'fragile_flowers' || (harshWeather && distanceKm > 1.2)) {
    return distanceKm > 6 ? 'car' : urgency === 'express' ? 'scooter' : 'cargo_bike';
  }
  if (distanceKm <= 4.5 && !harshWeather) {
    return urgency === 'express' && packageType === 'hot_food' ? 'ebike' : 'ebike';
  }
  if (distanceKm <= 7) {
    return urgency === 'express' ? 'scooter' : 'cargo_bike';
  }
  return 'car';
}

export interface CreateDeliveryInput {
  business_id: number;
  courier_id?: number | null;
  customer_name: string;
  dropoff_address: string;
  distance_km: number;
  package_type: PackageType;
  urgency: UrgencyLevel;
  weather: WeatherCondition;
  notes?: string | null;
}

export interface UpdateDeliveryInput {
  status?: DeliveryStatus;
  courier_id?: number | null;
  urgency?: UrgencyLevel;
  notes?: string | null;
}

export class DeliveryService {
  constructor(
    private deliveryRepo: DeliveryRepository,
    private businessRepo: BusinessRepository,
    private courierRepo: CourierRepository,
  ) {}

  list(filters?: { status?: string; businessId?: number }): Delivery[] {
    return this.deliveryRepo.findAll(filters);
  }

  getById(id: number): Delivery | null {
    return this.deliveryRepo.findById(id);
  }

  create(input: CreateDeliveryInput): Delivery {
    const business = this.businessRepo.findById(input.business_id);
    if (!business) {
      throw new Error(`Business #${input.business_id} not found`);
    }

    const recommendedMode = pickBestVehicle({
      distanceKm: input.distance_km,
      packageType: input.package_type,
      urgency: input.urgency,
      weather: input.weather,
    });

    let courier = input.courier_id ? this.courierRepo.findById(input.courier_id) : null;
    if (input.courier_id && !courier) {
      throw new Error(`Courier #${input.courier_id} not found`);
    }

    const activeVehicle = courier?.vehicle_type ?? recommendedMode;
    const eta = estimateEtaMinutes(input.distance_km, activeVehicle, input.urgency, input.weather);
    const co2Saved = calculateCo2SavedGrams(input.distance_km, activeVehicle);

    return this.deliveryRepo.create({
      business_id: input.business_id,
      courier_id: courier?.id ?? null,
      customer_name: input.customer_name,
      dropoff_address: input.dropoff_address,
      distance_km: input.distance_km,
      package_type: input.package_type,
      urgency: input.urgency,
      weather: input.weather,
      status: courier ? 'assigned' : 'pending',
      recommended_mode: recommendedMode,
      eta_minutes: eta,
      co2_saved_g: co2Saved,
      notes: input.notes ?? null,
    });
  }

  update(id: number, input: UpdateDeliveryInput): Delivery | null {
    const existing = this.deliveryRepo.findById(id);
    if (!existing) return null;

    let nextVehicle: VehicleType = existing.recommended_mode ?? 'ebike';
    let nextStatus = input.status ?? existing.status;

    if (input.courier_id !== undefined) {
      if (input.courier_id === null) {
        if (!input.status && existing.status === 'assigned') {
          nextStatus = 'pending';
        }
      } else {
        const courier = this.courierRepo.findById(input.courier_id);
        if (!courier) {
          throw new Error(`Courier #${input.courier_id} not found`);
        }
        nextVehicle = courier.vehicle_type;
        if (!input.status && existing.status === 'pending') {
          nextStatus = 'assigned';
        }
      }
    } else if (existing.courier_vehicle) {
      nextVehicle = existing.courier_vehicle;
    }

    const nextUrgency = input.urgency ?? existing.urgency;
    const eta = estimateEtaMinutes(existing.distance_km, nextVehicle, nextUrgency, existing.weather);
    const co2Saved = calculateCo2SavedGrams(existing.distance_km, nextVehicle);

    return this.deliveryRepo.update(id, {
      status: nextStatus,
      courier_id: input.courier_id,
      urgency: input.urgency,
      notes: input.notes,
      eta_minutes: eta,
      co2_saved_g: co2Saved,
    });
  }

  delete(id: number): boolean {
    return this.deliveryRepo.delete(id);
  }
}
