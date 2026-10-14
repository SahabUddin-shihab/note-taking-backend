import * as posts from '../services/post.service.js';
import { ah } from '../utils/index.js';

export const list = ah(async (req, res) => res.json({
  success: true,
  ...(await posts.list(req.valid.query))
}));

export const get = ah(async (req, res) => res.json({
  success: true,
  data: await posts.get(req.valid.params.id)
}));

export const listByAuthor = ah(async (req, res) => res.json({
  success: true,
  ...(await posts.listByAuthor(req.valid.params.userId, req.valid.query))
}));

export const create = ah(async (req, res) => res.status(201).json({
  success: true,
  data: await posts.create(req.user.id, req.valid.body)
}));

export const update = ah(async (req, res) => res.json({
  success: true,
  data: await posts.update(req.user, req.valid.params.id, req.valid.body)
}));

export const remove = ah(async (req, res) => {
  await posts.remove(req.user, req.valid.params.id);
  res.json({
    success: true,
    data: { message: 'Deleted' }
  });
});
