import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config as appConfig } from './config';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './middleware/logger';
import routes from './routes';

// Load .env from project root (two levels up from server/src/)
const __dirname = fileURLToPath(new URL('.', import.meta.url));
config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
app.use(express.json({ limit: '10mb' }));
const PORT = appConfig.PORT;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: appConfig.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(logger);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/v1/auth', strictLimiter);
app.use('/api/v1/', limiter);

// Routes
app.use('/api/v1', routes());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler (Express 5 compatible)
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${appConfig.NODE_ENV}`);
  console.log(`Supabase URL: ${appConfig.SUPABASE_URL || 'NOT SET'}`);
});

export default app;
