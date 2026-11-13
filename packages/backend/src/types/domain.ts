export type BusinessCategory = 'pizzeria' | 'florist' | 'bakery' | 'pharmacy' | 'grocery';

export type VehicleType = 'foot' | 'ebike' | 'cargo_bike' | 'scooter' | 'car';

export type PackageType = 'hot_food' | 'fragile_flowers' | 'bakery' | 'pharmacy' | 'general';

export type UrgencyLevel = 'standard' | 'express';

export type WeatherCondition = 'clear' | 'rain' | 'snow';

export type DeliveryStatus = 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'cancelled';

export interface Business {
  id: number;
  name: string;
  category: BusinessCategory;
  address: string;
  created_at: string;
}

export interface Courier {
  id: number;
  name: string;
  vehicle_type: VehicleType;
  is_available: boolean;
  max_weight_kg: number;
  weather_protected: boolean;
  co2_g_per_km: number;
}

export interface Delivery {
  id: number;
  business_id: number;
  business_name?: string;
  business_category?: BusinessCategory;
  courier_id: number | null;
  courier_name?: string | null;
  courier_vehicle?: VehicleType | null;
  customer_name: string;
  dropoff_address: string;
  distance_km: number;
  package_type: PackageType;
  urgency: UrgencyLevel;
  weather: WeatherCondition;
  status: DeliveryStatus;
  recommended_mode: VehicleType | null;
  eta_minutes: number | null;
  co2_saved_g: number;
  notes: string | null;
  created_at: string;
}

export interface DispatchAdvice {
  recommendedVehicle: VehicleType;
  matchedCourierId: number | null;
  matchedCourierName: string | null;
  etaMinutes: number;
  co2SavedGrams: number;
  reasoning: string;
  suggestedOrder: {
    packageType: PackageType;
    urgency: UrgencyLevel;
    weather: WeatherCondition;
    distanceKm: number;
    notes: string;
  };
  mode: 'llm' | 'fallback';
}
