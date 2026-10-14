import { Router } from 'express';
import auth from './auth.routes.js';
import users from './user.routes.js';
import notes from './note.routes.js';
import posts from './post.routes.js';
import admin from './admin.routes.js';

const r = Router();
r.use('/auth', auth);
r.use('/users', users);
r.use('/notes', notes);
r.use('/posts', posts);
r.use('/admin', admin);
export default r;
