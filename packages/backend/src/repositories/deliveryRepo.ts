import type { DatabaseClient } from '../db/database.js';
import type {
  Delivery,
  DeliveryStatus,
  PackageType,
  UrgencyLevel,
  VehicleType,
  WeatherCondition,
} from '../types/domain.js';

export interface CreateDeliveryRecord {
  business_id: number;
  courier_id: number | null;
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
}

export interface UpdateDeliveryRecord {
  status?: DeliveryStatus;
  courier_id?: number | null;
  urgency?: UrgencyLevel;
  notes?: string | null;
  eta_minutes?: number | null;
  co2_saved_g?: number;
}

const BASE_SELECT = `
  SELECT
    d.*,
    b.name AS business_name,
    b.category AS business_category,
    c.name AS courier_name,
    c.vehicle_type AS courier_vehicle
  FROM deliveries d
  LEFT JOIN businesses b ON d.business_id = b.id
  LEFT JOIN couriers c ON d.courier_id = c.id
`;

export class DeliveryRepository {
  constructor(private db: DatabaseClient) {}

  findAll(filters?: { status?: string; businessId?: number }): Delivery[] {
    const clauses: string[] = [];
    const params: unknown[] = [];

    if (filters?.status) {
      clauses.push('d.status = ?');
      params.push(filters.status);
    }
    if (filters?.businessId) {
      clauses.push('d.business_id = ?');
      params.push(filters.businessId);
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    return this.db.queryAll<Delivery>(`${BASE_SELECT} ${where} ORDER BY d.id DESC`, params);
  }

  findById(id: number): Delivery | null {
    return this.db.queryOne<Delivery>(`${BASE_SELECT} WHERE d.id = ?`, [id]);
  }

  create(record: CreateDeliveryRecord): Delivery {
    const now = new Date().toISOString();
    const res = this.db.run(
      `INSERT INTO deliveries (
        business_id, courier_id, customer_name, dropoff_address, distance_km,
        package_type, urgency, weather, status, recommended_mode, eta_minutes,
        co2_saved_g, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.business_id,
        record.courier_id,
        record.customer_name,
        record.dropoff_address,
        record.distance_km,
        record.package_type,
        record.urgency,
        record.weather,
        record.status,
        record.recommended_mode,
        record.eta_minutes,
        record.co2_saved_g,
        record.notes,
        now,
      ],
    );
    return this.findById(res.lastInsertRowid)!;
  }

  update(id: number, patch: UpdateDeliveryRecord): Delivery | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const sets: string[] = [];
    const params: unknown[] = [];

    if (patch.status !== undefined) {
      sets.push('status = ?');
      params.push(patch.status);
    }
    if (patch.courier_id !== undefined) {
      sets.push('courier_id = ?');
      params.push(patch.courier_id);
    }
    if (patch.urgency !== undefined) {
      sets.push('urgency = ?');
      params.push(patch.urgency);
    }
    if (patch.notes !== undefined) {
      sets.push('notes = ?');
      params.push(patch.notes);
    }
    if (patch.eta_minutes !== undefined) {
      sets.push('eta_minutes = ?');
      params.push(patch.eta_minutes);
    }
    if (patch.co2_saved_g !== undefined) {
      sets.push('co2_saved_g = ?');
      params.push(patch.co2_saved_g);
    }

    if (sets.length === 0) return existing;

    params.push(id);
    this.db.run(`UPDATE deliveries SET ${sets.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  }

  delete(id: number): boolean {
    const res = this.db.run('DELETE FROM deliveries WHERE id = ?', [id]);
    return res.changes > 0;
  }
}
