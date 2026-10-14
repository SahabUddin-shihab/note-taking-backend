import { Router } from 'express';
import { validate } from '../utils/index.js';
import { S, pageQuery } from '../validators/index.js';
import { authenticate } from '../middleware/index.js';
import * as c from '../controllers/post.controller.js';

const r = Router();
r.get('/', validate(pageQuery, 'query'), c.list);
r.get('/:id', validate(S.idParam, 'params'), c.get);
r.post('/', authenticate, validate(S.post), c.create);
r.put('/:id', authenticate, validate(S.idParam, 'params'), validate(S.postPatch), c.update);
r.delete('/:id', authenticate, validate(S.idParam, 'params'), c.remove);
export default r;
