import { Router } from 'express';
import { createControllers } from '../controllers/apiController.js';

export function createApiRouter(controllers: ReturnType<typeof createControllers>): Router {
  const router = Router();

  router.get('/health', controllers.health);

  router.get('/businesses', controllers.listBusinesses);
  router.post('/businesses', controllers.createBusiness);

  router.get('/couriers', controllers.listCouriers);
  router.post('/couriers', controllers.createCourier);
  router.patch('/couriers/:id', controllers.updateCourier);

  router.get('/deliveries', controllers.listDeliveries);
  router.post('/deliveries', controllers.createDelivery);
  router.patch('/deliveries/:id', controllers.updateDelivery);
  router.delete('/deliveries/:id', controllers.deleteDelivery);

  router.post('/dispatch/advise', controllers.adviseDispatch);

  return router;
}
