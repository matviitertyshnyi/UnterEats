import type { DatabaseClient } from '../db/database.js';
import type { Courier, VehicleType } from '../types/domain.js';

interface CourierRow {
  id: number;
  name: string;
  vehicle_type: VehicleType;
  is_available: number;
  max_weight_kg: number;
  weather_protected: number;
  co2_g_per_km: number;
}

function mapRow(row: CourierRow): Courier {
  return {
    ...row,
    is_available: Boolean(row.is_available),
    weather_protected: Boolean(row.weather_protected),
  };
}

export class CourierRepository {
  constructor(private db: DatabaseClient) {}

  findAll(): Courier[] {
    const rows = this.db.queryAll<CourierRow>('SELECT * FROM couriers ORDER BY id ASC');
    return rows.map(mapRow);
  }

  findAvailable(): Courier[] {
    const rows = this.db.queryAll<CourierRow>(
      'SELECT * FROM couriers WHERE is_available = 1 ORDER BY id ASC',
    );
    return rows.map(mapRow);
  }

  findById(id: number): Courier | null {
    const row = this.db.queryOne<CourierRow>('SELECT * FROM couriers WHERE id = ?', [id]);
    return row ? mapRow(row) : null;
  }

  create(input: {
    name: string;
    vehicle_type: VehicleType;
    max_weight_kg: number;
    weather_protected: boolean;
    co2_g_per_km: number;
  }): Courier {
    const res = this.db.run(
      `INSERT INTO couriers (name, vehicle_type, is_available, max_weight_kg, weather_protected, co2_g_per_km)
       VALUES (?, ?, 1, ?, ?, ?)`,
      [
        input.name,
        input.vehicle_type,
        input.max_weight_kg,
        input.weather_protected ? 1 : 0,
        input.co2_g_per_km,
      ],
    );
    return this.findById(res.lastInsertRowid)!;
  }

  updateAvailability(id: number, isAvailable: boolean): Courier | null {
    const existing = this.findById(id);
    if (!existing) return null;
    this.db.run('UPDATE couriers SET is_available = ? WHERE id = ?', [isAvailable ? 1 : 0, id]);
    return this.findById(id);
  }
}
