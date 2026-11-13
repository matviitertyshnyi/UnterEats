import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from './app.js';
import { DatabaseClient, initDatabase } from './db/database.js';

describe('UnterEats API', () => {
  let db: DatabaseClient;

  beforeEach(async () => {
    db = await initDatabase(':memory:');
  });

  afterEach(() => {
    db.close();
  });

  it('returns health status and seeded businesses & couriers', async () => {
    const app = createApp(db);

    const health = await request(app).get('/api/health');
    expect(health.status).toBe(200);
    expect(health.body.status).toBe('ok');

    const businesses = await request(app).get('/api/businesses');
    expect(businesses.status).toBe(200);
    expect(businesses.body.length).toBeGreaterThanOrEqual(4);

    const couriers = await request(app).get('/api/couriers');
    expect(couriers.status).toBe(200);
    expect(couriers.body.length).toBeGreaterThanOrEqual(5);
  });

  it('supports full delivery CRUD lifecycle', async () => {
    const app = createApp(db);

    const created = await request(app).post('/api/deliveries').send({
      business_id: 1,
      customer_name: 'Jan Kowalski',
      dropoff_address: '77 Oak St',
      distance_km: 2.5,
      package_type: 'hot_food',
      urgency: 'express',
      weather: 'clear',
      notes: 'Ring bell twice',
    });

    expect(created.status).toBe(201);
    expect(created.body.status).toBe('pending');
    expect(created.body.recommended_mode).toBe('ebike');
    expect(created.body.co2_saved_g).toBeGreaterThan(0);

    const deliveryId = created.body.id;

    const updated = await request(app).patch(`/api/deliveries/${deliveryId}`).send({
      courier_id: 1,
      status: 'in_transit',
    });
    expect(updated.status).toBe(200);
    expect(updated.body.status).toBe('in_transit');
    expect(updated.body.courier_name).toBe('Elena R.');

    const deleted = await request(app).delete(`/api/deliveries/${deliveryId}`);
    expect(deleted.status).toBe(204);

    const listAfter = await request(app).get('/api/deliveries');
    expect(listAfter.body.some((d: { id: number }) => d.id === deliveryId)).toBe(false);
  });

  it('toggles courier availability', async () => {
    const app = createApp(db);
    const res = await request(app).patch('/api/couriers/1').send({ is_available: false });
    expect(res.status).toBe(200);
    expect(res.body.is_available).toBe(false);
  });

  it('returns structured AI dispatch advice in fallback mode', async () => {
    const app = createApp(db);
    delete process.env.OPENAI_API_KEY;

    const res = await request(app).post('/api/dispatch/advise').send({
      prompt: 'Need to deliver 2 fragile flower bouquets 3.2 km in heavy rain',
    });

    expect(res.status).toBe(200);
    expect(res.body.mode).toBe('fallback');
    expect(res.body.recommendedVehicle).toBe('cargo_bike');
    expect(res.body.suggestedOrder.packageType).toBe('fragile_flowers');
    expect(res.body.suggestedOrder.weather).toBe('rain');
    expect(res.body.co2SavedGrams).toBeGreaterThan(0);
  });
});
