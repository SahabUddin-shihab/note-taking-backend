import * as users from '../services/user.service.js';
import { ah } from '../utils/index.js';

export const getMe = ah(async (req, res) => res.json({
  success: true,
  data: await users.getProfile(req.user.id)
}));

export const updateMe = ah(async (req, res) => res.json({
  success: true,
  data: await users.updateProfile(req.user.id, req.valid.body)
}));
