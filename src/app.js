import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.js';
import { sanitize } from './utils/index.js';
import { notFound, errorHandler } from './middleware/index.js';
import routes from './routes/index.js';

const app = express();
app.use(helmet());

app.use(cors({
  origin: (o, cb) => cb(null, !o || env.corsOrigins.includes(o))
}));

app.use(express.json({ limit: '100kb' }));
app.use(sanitize);
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);
export default app;
