import fs from 'node:fs';
import path from 'node:path';
import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';

let sqlJsPromise: Promise<SqlJsStatic> | null = null;

function getSqlJs(): Promise<SqlJsStatic> {
  if (!sqlJsPromise) {
    sqlJsPromise = initSqlJs();
  }
  return sqlJsPromise;
}

export class DatabaseClient {
  private db: Database;
  private filePath: string | null;

  constructor(db: Database, filePath: string | null) {
    this.db = db;
    this.filePath = filePath;
  }

  queryAll<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T[] {
    const stmt = this.db.prepare(sql);
    stmt.bind(params as (string | number | null | Uint8Array)[]);
    const rows: T[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject() as T);
    }
    stmt.free();
    return rows;
  }

  queryOne<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T | null {
    const rows = this.queryAll<T>(sql, params);
    return rows[0] ?? null;
  }

  run(sql: string, params: unknown[] = []): { lastInsertRowid: number; changes: number } {
    this.db.run(sql, params as (string | number | null | Uint8Array)[]);
    const row = this.queryOne<{ id: number }>('SELECT last_insert_rowid() AS id');
    const changes = this.db.getRowsModified();
    this.persist();
    return {
      lastInsertRowid: row?.id ?? 0,
      changes,
    };
  }

  exec(sql: string): void {
    this.db.exec(sql);
    this.persist();
  }

  persist(): void {
    if (!this.filePath) return;
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const data = this.db.export();
    fs.writeFileSync(this.filePath, Buffer.from(data));
  }

  close(): void {
    this.db.close();
  }
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS businesses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  address TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS couriers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  is_available INTEGER NOT NULL DEFAULT 1,
  max_weight_kg REAL NOT NULL,
  weather_protected INTEGER NOT NULL DEFAULT 0,
  co2_g_per_km REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS deliveries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id INTEGER NOT NULL,
  courier_id INTEGER,
  customer_name TEXT NOT NULL,
  dropoff_address TEXT NOT NULL,
  distance_km REAL NOT NULL,
  package_type TEXT NOT NULL,
  urgency TEXT NOT NULL,
  weather TEXT NOT NULL,
  status TEXT NOT NULL,
  recommended_mode TEXT,
  eta_minutes INTEGER,
  co2_saved_g REAL NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  FOREIGN KEY (courier_id) REFERENCES couriers(id)
);
`;

function seedIfEmpty(client: DatabaseClient): void {
  const existing = client.queryOne<{ count: number }>('SELECT COUNT(*) AS count FROM businesses');
  if ((existing?.count ?? 0) > 0) return;

  const now = new Date().toISOString();

  client.run(
    'INSERT INTO businesses (name, category, address, created_at) VALUES (?, ?, ?, ?)',
    ['Bella Napoli Pizzeria', 'pizzeria', '14 Market St', now],
  );
  client.run(
    'INSERT INTO businesses (name, category, address, created_at) VALUES (?, ?, ?, ?)',
    ['Petal & Stem Florist', 'florist', '82 Elm Ave', now],
  );
  client.run(
    'INSERT INTO businesses (name, category, address, created_at) VALUES (?, ?, ?, ?)',
    ['Sourdough & Co. Bakery', 'bakery', '5 Linden Sq', now],
  );
  client.run(
    'INSERT INTO businesses (name, category, address, created_at) VALUES (?, ?, ?, ?)',
    ['GreenCross Local Pharmacy', 'pharmacy', '109 Oak Blvd', now],
  );

  client.run(
    'INSERT INTO couriers (name, vehicle_type, is_available, max_weight_kg, weather_protected, co2_g_per_km) VALUES (?, ?, ?, ?, ?, ?)',
    ['Elena R.', 'ebike', 1, 15, 0, 8],
  );
  client.run(
    'INSERT INTO couriers (name, vehicle_type, is_available, max_weight_kg, weather_protected, co2_g_per_km) VALUES (?, ?, ?, ?, ?, ?)',
    ['Marek K.', 'cargo_bike', 1, 45, 1, 10],
  );
  client.run(
    'INSERT INTO couriers (name, vehicle_type, is_available, max_weight_kg, weather_protected, co2_g_per_km) VALUES (?, ?, ?, ?, ?, ?)',
    ['Tomasz W.', 'scooter', 1, 20, 1, 65],
  );
  client.run(
    'INSERT INTO couriers (name, vehicle_type, is_available, max_weight_kg, weather_protected, co2_g_per_km) VALUES (?, ?, ?, ?, ?, ?)',
    ['Maya L.', 'foot', 1, 8, 0, 0],
  );
  client.run(
    'INSERT INTO couriers (name, vehicle_type, is_available, max_weight_kg, weather_protected, co2_g_per_km) VALUES (?, ?, ?, ?, ?, ?)',
    ['Daniel S.', 'car', 1, 150, 1, 170],
  );

  client.run(
    `INSERT INTO deliveries (
      business_id, courier_id, customer_name, dropoff_address, distance_km,
      package_type, urgency, weather, status, recommended_mode, eta_minutes,
      co2_saved_g, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [1, 1, 'Anna Kowalska', '220 River Rd', 2.4, 'hot_food', 'express', 'clear', 'in_transit', 'ebike', 12, 389, 'Thermal bag required', now],
  );
  client.run(
    `INSERT INTO deliveries (
      business_id, courier_id, customer_name, dropoff_address, distance_km,
      package_type, urgency, weather, status, recommended_mode, eta_minutes,
      co2_saved_g, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [2, 2, 'Jonas Lind', '44 Parkside Ct', 3.1, 'fragile_flowers', 'standard', 'rain', 'assigned', 'cargo_bike', 19, 496, 'Keep bouquets upright & dry', now],
  );
  client.run(
    `INSERT INTO deliveries (
      business_id, courier_id, customer_name, dropoff_address, distance_km,
      package_type, urgency, weather, status, recommended_mode, eta_minutes,
      co2_saved_g, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [3, null, 'Claire Vance', '19 Cedar Ln', 0.8, 'bakery', 'standard', 'clear', 'pending', 'foot', 11, 136, '2 pastry boxes', now],
  );
  client.run(
    `INSERT INTO deliveries (
      business_id, courier_id, customer_name, dropoff_address, distance_km,
      package_type, urgency, weather, status, recommended_mode, eta_minutes,
      co2_saved_g, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [4, 3, 'Piotr Nowak', '310 Maple Ave', 4.6, 'pharmacy', 'express', 'rain', 'delivered', 'scooter', 15, 483, 'Urgent prescription', now],
  );
}

export async function initDatabase(dbPath?: string): Promise<DatabaseClient> {
  const SQL = await getSqlJs();
  const isMemory = !dbPath || dbPath === ':memory:';
  let db: Database;

  if (!isMemory && fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  const client = new DatabaseClient(db, isMemory ? null : dbPath);
  client.exec(SCHEMA_SQL);
  seedIfEmpty(client);
  return client;
}
