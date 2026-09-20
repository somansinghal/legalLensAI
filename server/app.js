import express from 'express';
import helmet from 'helmet';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import protectedRouter from './routes/protected.js';
import analysisRouter from './routes/analysis.js';
import demosRouter from './routes/demos.js';
import contactRouter from './routes/contact.js';
import checklistRouter from './routes/checklist.js';
import userRouter from './routes/user.js';
import documentsRouter from './routes/documents.js';
import { initFirebase } from './services/firebaseService.js';
import { config } from './utils/config.js';
import { requestContext } from './middleware/requestContext.js';
import { createRateLimiter } from './middleware/rateLimit.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');


export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"]
      }
    },
    referrerPolicy: { policy: 'no-referrer' }
  }));
  app.use(requestContext);
  app.use(createRateLimiter({ windowMs: config.rateLimitWindowMs, max: config.rateLimitMax }));
  

  app.use(express.json({ limit: config.bodyLimit, strict: true }));

  const authLimiter = createRateLimiter({ windowMs: 15 * 60_000, max: 20 });
  const aiLimiter = createRateLimiter({ windowMs: 60 * 60_000, max: 10 });
  const contactLimiter = createRateLimiter({ windowMs: 60 * 60_000, max: 5 });

  initFirebase();

  app.use('/api', healthRouter);
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/demo', authLimiter);
  app.use('/api/auth', authRouter);
  app.use('/api/protected', protectedRouter);
  app.use('/api', aiLimiter, analysisRouter);
  app.use('/api/documents', documentsRouter);
  app.use('/api', checklistRouter);
  app.use('/api/user', userRouter);
  app.use('/api/demos', demosRouter);
  app.use('/api', contactLimiter, contactRouter);
  
  app.use(express.static(publicDir, { index: 'index.html' }));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
