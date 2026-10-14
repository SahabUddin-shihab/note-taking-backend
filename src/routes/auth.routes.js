import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { validate } from '../utils/index.js';
import { S } from '../validators/index.js';
import { authenticate } from '../middleware/index.js';
import * as c from '../controllers/auth.controller.js';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.nodeEnv === 'test' ? 1000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_q, res) => res.status(429).json({
    success: false,
    error: {
      message: 'Too many attempts, try later'
    }
  })
});

const r = Router();
r.post('/register', limiter, validate(S.register), c.register);
r.post('/login', limiter, validate(S.login), c.login);
r.post('/logout', authenticate, c.logout);
r.get('/me', authenticate, c.me);
export default r;
