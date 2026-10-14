import { Router } from 'express';
import { validate } from '../utils/index.js';
import { S, pageQuery } from '../validators/index.js';
import { authenticate, authorizeRoles } from '../middleware/index.js';
import * as c from '../controllers/admin.controller.js';

const r = Router();
r.use(authenticate, authorizeRoles('admin'));
r.get('/users', validate(pageQuery, 'query'), c.listUsers);

r.get('/users/interests', validate(pageQuery, 'query'), c.interestGroups); // before '/users/:id'


r.get('/users/:id', validate(S.idParam, 'params'), c.getUser);
r.post('/users', validate(S.adminCreate), c.createUser);
r.put('/users/:id', validate(S.idParam, 'params'), validate(S.adminPatch), c.updateUser);
r.delete('/users/:id', validate(S.idParam, 'params'), c.removeUser);
r.get('/notes', validate(S.adminNotesQuery, 'query'), c.listNotes);
r.get('/notes/:id', validate(S.idParam, 'params'), c.getNote);
export default r;
