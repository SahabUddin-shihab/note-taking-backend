import * as notes from '../services/note.service.js';
import { ah } from '../utils/index.js';

export const create = ah(async (req, res) => res.status(201).json({
  success: true,
  data: await notes.create(req.user.id, req.valid.body)
}));

export const list = ah(async (req, res) => res.json({
  success: true,
  ...(await notes.listOwn(req.user.id, req.valid.query))
}));

export const get = ah(async (req, res) => res.json({
  success: true,
  data: await notes.getOwn(req.user.id, req.valid.params.id)
}));

export const update = ah(async (req, res) => res.json({
  success: true,
  data: await notes.updateOwn(req.user.id, req.valid.params.id, req.valid.body)
}));

export const remove = ah(async (req, res) => {
  await notes.removeOwn(req.user.id, req.valid.params.id);
  res.json({
    success: true,
    data: { message: 'Deleted' }
  });
});
