import { getSupabase } from '../lib/supabase';
import { authMiddleware } from '../middleware/auth';
import productsRouter from './products';
import servicesRouter from './services';
import requestsRouter from './requests';
import chatRouter from './chat';
import adminRouter from './admin';
import aiRouter from './ai';
import authRouter from './auth';

export default function routes() {
  const router = require('express').Router();

  router.use('/auth', authRouter());
  router.use('/products', productsRouter());
  router.use('/services', servicesRouter());
  router.use('/requests', requestsRouter());
  router.use('/chat', chatRouter());
  router.use('/admin', authMiddleware, adminRouter());
  router.use('/ai', aiRouter());

  return router;
}
