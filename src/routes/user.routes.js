import { Router } from 'express';
import { validate } from '../utils/index.js';
import { S, pageQuery } from '../validators/index.js';
import { authenticate } from '../middleware/index.js';
import * as c from '../controllers/user.controller.js';
import * as posts from '../controllers/post.controller.js';

const r = Router();
r.get('/me', authenticate, c.getMe);
r.put('/me', authenticate, validate(S.profile), c.updateMe);
r.get('/:userId/posts', validate(S.userIdParam, 'params'), validate(pageQuery, 'query'), posts.listByAuthor);
export default r;
