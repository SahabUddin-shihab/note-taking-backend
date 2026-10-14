import mongoose from 'mongoose';
import { env } from './config/env.js';
import app from './app.js';

await mongoose.connect(env.mongoUri);
await mongoose.syncIndexes();
app.listen(env.port, () => console.log(`API listening on :${env.port}`));
