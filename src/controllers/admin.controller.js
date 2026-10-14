import * as users from '../services/user.service.js';
import * as notes from '../services/note.service.js';
import { ah } from '../utils/index.js';

export const listUsers = ah(async (req, res) => res.json({
  success: true,
  ...(await users.list(req.valid.query))
}));

export const interestGroups = ah(async (req, res) => res.json({
  success: true,
  ...(await users.groupByInterest(req.valid.query))
}));

export const getUser = ah(async (req, res) => res.json({
  success: true,
  data: await users.getById(req.valid.params.id)
}));

export const createUser = ah(async (req, res) => res.status(201).json({
  success: true,
  data: await users.create(req.valid.body)
}));

export const updateUser = ah(async (req, res) => res.json({
  success: true,
  data: await users.update(req.valid.params.id, req.valid.body)
}));

export const removeUser = ah(async (req, res) => {
  await users.remove(req.valid.params.id);
  res.json({
    success: true,
    data: { message: 'Deleted' }
  });
});

export const listNotes = ah(async (req, res) => res.json({
  success: true,
  ...(await notes.listAll(req.valid.query))
}));

export const getNote = ah(async (req, res) => res.json({
  success: true,
  data: await notes.getAny(req.valid.params.id)
}));
