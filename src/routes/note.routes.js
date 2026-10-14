import { Router } from 'express';
import { validate } from '../utils/index.js';
import { S, pageQuery } from '../validators/index.js';
import { authenticate } from '../middleware/index.js';
import * as c from '../controllers/note.controller.js';

const r = Router();
r.use(authenticate);
r.post('/', validate(S.note), c.create);
r.get('/', validate(pageQuery, 'query'), c.list);
r.get('/:id', validate(S.idParam, 'params'), c.get);
r.put('/:id', validate(S.idParam, 'params'), validate(S.notePatch), c.update);
r.delete('/:id', validate(S.idParam, 'params'), c.remove);
export default r;
