import cors from 'cors';
import express, { type Express } from 'express';
import { createControllers } from './controllers/apiController.js';
import type { DatabaseClient } from './db/database.js';
import { BusinessRepository } from './repositories/businessRepo.js';
import { CourierRepository } from './repositories/courierRepo.js';
import { DeliveryRepository } from './repositories/deliveryRepo.js';
import { createApiRouter } from './routes/apiRoutes.js';
import { DeliveryService } from './services/deliveryService.js';
import { DispatchService } from './services/dispatchService.js';

export function createApp(db: DatabaseClient): Express {
  const app = express();

  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json());

  const businessRepo = new BusinessRepository(db);
  const courierRepo = new CourierRepository(db);
  const deliveryRepo = new DeliveryRepository(db);
  const deliveryService = new DeliveryService(deliveryRepo, businessRepo, courierRepo);
  const dispatchService = new DispatchService(courierRepo);

  const controllers = createControllers({
    businessRepo,
    courierRepo,
    deliveryService,
    dispatchService,
  });

  app.use('/api', createApiRouter(controllers));

  return app;
}
