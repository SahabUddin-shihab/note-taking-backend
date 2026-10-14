import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../src/config/env.js';
import User from '../src/models/User.js';

const { ADMIN_NAME = 'Admin', ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (min 8 chars)');
  process.exit(1);
}

await mongoose.connect(env.mongoUri);
const email = ADMIN_EMAIL.trim().toLowerCase();

const r = await User.updateOne({ email }, {
  $setOnInsert: {
    name: ADMIN_NAME,
    email,
    role: 'admin',
    password: await bcrypt.hash(ADMIN_PASSWORD, 12),
    interests: []
  }
}, { upsert: true });

console.log(r.upsertedCount ? 'Admin created' : 'User already exists; nothing changed (safe to rerun)');
await mongoose.disconnect();
