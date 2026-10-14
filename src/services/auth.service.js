import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';
import { AppError } from '../utils/index.js';

const DUMMY_HASH = bcrypt.hashSync('dummy-password', 12); // equalises timing when the email is unknown


export const hashPassword = (p) => bcrypt.hash(p, 12);

export const signToken = (u) => jwt.sign({
  sub: String(u._id),
  tv: u.tokenVersion ?? 0
}, env.jwtSecret, {
  expiresIn: env.jwtExpires,
  algorithm: 'HS256'
});

export async function register({ password, ...rest }) {
  const user = await User.create({
    ...rest,
    password: await hashPassword(password),
    role: 'user'
  }); // role never client-controlled
  return { user, token: signToken(user) };
}

export async function login({ email, password }) {
  const user = await User.findOne({ email }).select('+password +tokenVersion');
  const ok = await bcrypt.compare(password, user?.password || DUMMY_HASH);
  if (!user || !ok) throw new AppError(401, 'Invalid email or password');
  return { user, token: signToken(user) };
}

export const logout = (userId) => User.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } }); // revokes all issued tokens

