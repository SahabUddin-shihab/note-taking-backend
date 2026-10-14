import * as auth from '../services/auth.service.js';
import * as users from '../services/user.service.js';
import { ah } from '../utils/index.js';

export const register = ah(async (req, res) => res.status(201).json({
  success: true,
  data: await auth.register(req.valid.body)
}));

export const login = ah(async (req, res) => res.json({
  success: true,
  data: await auth.login(req.valid.body)
}));

export const logout = ah(async (req, res) => {
  await auth.logout(req.user.id);
  res.json({
    success: true,
    data: {
      message: 'Logged out; issued tokens revoked'
    }
  });
});

export const me = ah(async (req, res) => res.json({
  success: true,
  data: await users.getProfile(req.user.id)
}));
