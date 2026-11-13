import type { Request, Response } from 'express';
import { z } from 'zod';
import { BusinessRepository } from '../repositories/businessRepo.js';
import { CourierRepository } from '../repositories/courierRepo.js';
import { DeliveryService } from '../services/deliveryService.js';
import { DispatchService } from '../services/dispatchService.js';

const createBusinessSchema = z.object({
  name: z.string().trim().min(2).max(100),
  category: z.enum(['pizzeria', 'florist', 'bakery', 'pharmacy', 'grocery']),
  address: z.string().trim().min(3).max(200),
});

const createCourierSchema = z.object({
  name: z.string().trim().min(2).max(80),
  vehicle_type: z.enum(['foot', 'ebike', 'cargo_bike', 'scooter', 'car']),
  max_weight_kg: z.number().positive().max(500),
  weather_protected: z.boolean(),
  co2_g_per_km: z.number().min(0).max(500),
});

const patchCourierSchema = z.object({
  is_available: z.boolean(),
});

const createDeliverySchema = z.object({
  business_id: z.number().int().positive(),
  courier_id: z.number().int().positive().nullable().optional(),
  customer_name: z.string().trim().min(2).max(100),
  dropoff_address: z.string().trim().min(3).max(200),
  distance_km: z.number().positive().max(50),
  package_type: z.enum(['hot_food', 'fragile_flowers', 'bakery', 'pharmacy', 'general']),
  urgency: z.enum(['standard', 'express']),
  weather: z.enum(['clear', 'rain', 'snow']),
  notes: z.string().trim().max(300).nullable().optional(),
});

const updateDeliverySchema = z.object({
  status: z.enum(['pending', 'assigned', 'in_transit', 'delivered', 'cancelled']).optional(),
  courier_id: z.number().int().positive().nullable().optional(),
  urgency: z.enum(['standard', 'express']).optional(),
  notes: z.string().trim().max(300).nullable().optional(),
});

const dispatchPromptSchema = z.object({
  prompt: z.string().trim().min(3).max(1000),
});

function parseId(raw: string | string[]): number | null {
  const val = Array.isArray(raw) ? raw[0] : raw;
  const id = Number(val);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function createControllers(deps: {
  businessRepo: BusinessRepository;
  courierRepo: CourierRepository;
  deliveryService: DeliveryService;
  dispatchService: DispatchService;
}) {
  const { businessRepo, courierRepo, deliveryService, dispatchService } = deps;

  return {
    health: (_req: Request, res: Response) => {
      res.json({ status: 'ok', service: 'untereats-api' });
    },

    listBusinesses: (_req: Request, res: Response) => {
      res.json(businessRepo.findAll());
    },

    createBusiness: (req: Request, res: Response) => {
      const parsed = createBusinessSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid business payload', details: parsed.error.flatten() });
        return;
      }
      const created = businessRepo.create(parsed.data);
      res.status(201).json(created);
    },

    listCouriers: (_req: Request, res: Response) => {
      res.json(courierRepo.findAll());
    },

    createCourier: (req: Request, res: Response) => {
      const parsed = createCourierSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid courier payload', details: parsed.error.flatten() });
        return;
      }
      const created = courierRepo.create(parsed.data);
      res.status(201).json(created);
    },

    updateCourier: (req: Request, res: Response) => {
      const id = parseId(req.params.id);
      if (!id) {
        res.status(400).json({ error: 'Invalid courier ID' });
        return;
      }
      const parsed = patchCourierSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid courier update', details: parsed.error.flatten() });
        return;
      }
      const updated = courierRepo.updateAvailability(id, parsed.data.is_available);
      if (!updated) {
        res.status(404).json({ error: 'Courier not found' });
        return;
      }
      res.json(updated);
    },

    listDeliveries: (req: Request, res: Response) => {
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const businessIdRaw = typeof req.query.businessId === 'string' ? Number(req.query.businessId) : undefined;
      const businessId = businessIdRaw && Number.isInteger(businessIdRaw) ? businessIdRaw : undefined;
      res.json(deliveryService.list({ status, businessId }));
    },

    createDelivery: (req: Request, res: Response) => {
      const parsed = createDeliverySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid delivery payload', details: parsed.error.flatten() });
        return;
      }
      try {
        const created = deliveryService.create(parsed.data);
        res.status(201).json(created);
      } catch (err) {
        res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to create delivery' });
      }
    },

    updateDelivery: (req: Request, res: Response) => {
      const id = parseId(req.params.id);
      if (!id) {
        res.status(400).json({ error: 'Invalid delivery ID' });
        return;
      }
      const parsed = updateDeliverySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid update payload', details: parsed.error.flatten() });
        return;
      }
      try {
        const updated = deliveryService.update(id, parsed.data);
        if (!updated) {
          res.status(404).json({ error: 'Delivery not found' });
          return;
        }
        res.json(updated);
      } catch (err) {
        res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to update delivery' });
      }
    },

    deleteDelivery: (req: Request, res: Response) => {
      const id = parseId(req.params.id);
      if (!id) {
        res.status(400).json({ error: 'Invalid delivery ID' });
        return;
      }
      const deleted = deliveryService.delete(id);
      if (!deleted) {
        res.status(404).json({ error: 'Delivery not found' });
        return;
      }
      res.status(204).send();
    },

    adviseDispatch: async (req: Request, res: Response) => {
      const parsed = dispatchPromptSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Prompt must be at least 3 characters', details: parsed.error.flatten() });
        return;
      }
      const advice = await dispatchService.advise(parsed.data.prompt);
      res.json(advice);
    },
  };
}
