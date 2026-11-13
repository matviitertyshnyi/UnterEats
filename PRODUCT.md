# PRODUCT.md — UnterEats

## One-Liner
Local-business last-mile delivery & AI dispatch board connecting neighborhood shops (pizzerias, flower shops, bakeries, pharmacies) with right-sized eco-friendly couriers.

## Target Users
- **Local Shop Owners / Dispatchers**: Need to send fragile, hot, or urgent local deliveries quickly without enterprise logistics overhead.
- **Local Couriers**: E-bike, cargo-bike, scooter, foot, and car couriers available in the neighborhood.

## Core Jobs-to-be-Done
1. **Create & Manage Delivery Orders** (CRUD): Log pickup shop, dropoff address, distance, package type (`hot_food`, `fragile_flowers`, `bakery`, `pharmacy`, `general`), urgency, and weather.
2. **Manage Local Couriers & Shops**: View/add local businesses and toggle courier availability or add couriers.
3. **Track & Update Order Lifecycle**: Move orders through `pending` -> `assigned` -> `in_transit` -> `delivered` (or `cancelled`), edit details, or delete.
4. **AI Dispatch Assistant (Creative Twist)**: Describe a delivery in plain English (e.g., *"2 fragile flower bouquets, 3.2 km, raining, need within 30 min"*) and get an instant mode recommendation, courier match, ETA, CO₂ comparison, reasoning, and one-click order creation.

## Mode
- **Operate**: Task-focused dispatch workbench. Prioritizes scanability, clear status hierarchy, fast order creation, and trustworthy AI recommendations.
