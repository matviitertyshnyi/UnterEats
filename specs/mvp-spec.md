# UnterEats MVP Specification

## 1. Data Model (SQLite)

### `businesses`
| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `name` | TEXT NOT NULL | e.g., "Bella Napoli Pizzeria" |
| `category` | TEXT NOT NULL | `pizzeria` \| `florist` \| `bakery` \| `pharmacy` \| `grocery` |
| `address` | TEXT NOT NULL | Pickup street address |
| `created_at` | TEXT NOT NULL | ISO timestamp |

### `couriers`
| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `name` | TEXT NOT NULL | Courier display name |
| `vehicle_type` | TEXT NOT NULL | `foot` \| `ebike` \| `cargo_bike` \| `scooter` \| `car` |
| `is_available` | INTEGER NOT NULL | `1` or `0` |
| `max_weight_kg` | REAL NOT NULL | Capacity |
| `weather_protected` | INTEGER NOT NULL | `1` (covered) or `0` (open) |
| `co2_g_per_km` | REAL NOT NULL | Carbon footprint per km |

### `deliveries`
| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `business_id` | INTEGER FK | References `businesses.id` |
| `courier_id` | INTEGER FK NULL | References `couriers.id` |
| `customer_name` | TEXT NOT NULL | Recipient name |
| `dropoff_address` | TEXT NOT NULL | Destination address |
| `distance_km` | REAL NOT NULL | Estimated route distance |
| `package_type` | TEXT NOT NULL | `hot_food` \| `fragile_flowers` \| `bakery` \| `pharmacy` \| `general` |
| `urgency` | TEXT NOT NULL | `standard` \| `express` |
| `weather` | TEXT NOT NULL | `clear` \| `rain` \| `snow` |
| `status` | TEXT NOT NULL | `pending` \| `assigned` \| `in_transit` \| `delivered` \| `cancelled` |
| `recommended_mode` | TEXT NULL | Suggested vehicle type |
| `eta_minutes` | INTEGER NULL | Estimated delivery time |
| `co2_saved_g` | REAL NOT NULL | Grams CO₂ saved vs baseline car (170 g/km) |
| `notes` | TEXT NULL | Special handling notes |
| `created_at` | TEXT NOT NULL | ISO timestamp |

## 2. REST API Endpoints (`/api`)
- `GET /api/health` — Health check
- `GET /api/businesses` — List businesses
- `POST /api/businesses` — Create business
- `GET /api/couriers` — List couriers
- `POST /api/couriers` — Create courier
- `PATCH /api/couriers/:id` — Toggle availability / update courier
- `GET /api/deliveries` — List deliveries (optional `?status=`, `?businessId=`)
- `POST /api/deliveries` — Create delivery (computes ETA & CO₂ savings)
- `PATCH /api/deliveries/:id` — Update delivery (status, courier_id, notes, urgency)
- `DELETE /api/deliveries/:id` — Delete delivery
- `POST /api/dispatch/advise` — AI Dispatch Agent endpoint (accepts natural language prompt + optional context, returns structured recommendation + matched courier + draft order)
