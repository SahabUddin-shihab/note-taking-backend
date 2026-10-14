import { AppError } from './AppError.js';

export { AppError };
export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const pageMeta = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit)
});

export const skipOf = ({ page, limit }) => (page - 1) * limit;

export const validate = (schema, where = 'body') => (req, _res, next) => {
  const r = schema.safeParse(req[where]);
  if (!r.success)
    return next(new AppError(422, 'Validation failed', r.error.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message
    }))));
  req.valid = { ...req.valid, [where]: r.data };
  next();
};

const clean = (o) => {
  if (Array.isArray(o)) return o.forEach(clean);
  if (o && typeof o === 'object')
    for (const k of Object.keys(o)) {
      if (k.startsWith('$') || k.includes('.'))
        delete o[k];
      else clean(o[k]);
    }
};

export const sanitize = (req, _res, next) => {
  clean(req.body);
  clean(req.query);
  clean(req.params);
  next();
}; // strips Mongo operators

