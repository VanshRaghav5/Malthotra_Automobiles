import { authMiddleware } from '../middleware/auth';
import productsRouter from './products';
import servicesRouter from './services';
import requestsRouter from './requests';
import chatRouter from './chat';
import adminRouter from './admin';
import aiRouter from './ai';
import authRouter from './auth';
import settingsRouter from './settings';
import express from 'express';

export default function routes() {
  const router = express.Router();

  router.use('/auth', authRouter());
  router.use('/settings', settingsRouter());
  router.use('/products', productsRouter());
  router.use('/services', servicesRouter());
  router.use('/requests', requestsRouter());
  router.use('/chat', authMiddleware, chatRouter());
  router.use('/admin', adminRouter());
  router.use('/ai', aiRouter());

  return router;
}
