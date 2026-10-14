import jwt from 'jsonwebtoken';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import User from '../models/User.js';
import { AppError } from '../utils/index.js';

export const authenticate = async (req, _res, next) => {
  try {
    const h = req.headers.authorization || '';
    if (!h.startsWith('Bearer ')) throw new AppError(401, 'Authentication required');
    let p;
    try {
      p = jwt.verify(h.slice(7), env.jwtSecret, { algorithms: ['HS256'] });
    } catch {
      throw new AppError(401, 'Invalid or expired token');
    }
    const u = await User.findById(p.sub).select('role tokenVersion').lean();
    if (!u || u.tokenVersion !== p.tv) throw new AppError(401, 'Invalid or expired token');
    req.user = { id: u._id, role: u.role };
    next();
  } catch (e) {
    next(e);
  }
};

export const authorizeRoles = (...roles) => (req, _res, next) => roles.includes(req.user?.role) ? next() : next(new AppError(403, 'Forbidden'));
export const notFound = (_req, _res, next) => next(new AppError(404, 'Route not found'));

export const errorHandler = (err, _req, res, _next) => {
  let { status = 500, message, details } = err;
  if (err instanceof ZodError) {
    status = 422;
    message = 'Validation failed';
  } else if (err.code === 11000) {
    status = 409;
    message = 'Resource already exists';
  } else if (err.name === 'CastError' || err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed request';
  }
  if (status >= 500) {
    console.error(err.message);
    message = 'Internal server error';
    details = undefined;
  }
  res.status(status).json({
    success: false,
    error: {
      message,
      ...(details && { details })
    }
  });
};
