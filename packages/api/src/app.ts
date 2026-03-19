import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/error';
import { authMiddleware } from './middleware/auth';
import { mountModules, getModules } from './lib/module-registry';

// Import modules to trigger registration
import './modules/users/users.router';
import './modules/tasks/tasks.router';
import './modules/calendar/calendar.router';
import './modules/shopping/shopping.router';
import './modules/transit/transit.router';
import authRouter from './modules/users/auth.router';

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// Public routes
app.use('/api/v1/auth', authRouter);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Protected routes
const protectedRouter = express.Router();
protectedRouter.use(authMiddleware);
mountModules(protectedRouter);
protectedRouter.get('/modules', (_req, res) => res.json(getModules()));
app.use('/api/v1', protectedRouter);

app.use(errorHandler);

export default app;
