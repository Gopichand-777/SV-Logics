import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes.js';
import coursesRoutes from './routes/courses.routes.js';
import testsRoutes from './routes/tests.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { pool } from './db/index.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    process.env.ADMIN_URL    || 'http://localhost:5174',
  ],
  credentials: true,
}));

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  message: { error: 'Too many requests. Please try again later.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts. Please try again later.' },
});
app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ── Body Parser ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV,
    });
  } catch {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/courses',   coursesRoutes);
app.use('/api/tests',     testsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/payments',  paymentRoutes);
app.use('/api/admin',     adminRoutes);

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// ── Start Server ──────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log('\n🚀 SV Logics API Server');
  console.log(`   ✅ Running on   : http://localhost:${PORT}`);
  console.log(`   ✅ Health check : http://localhost:${PORT}/api/health`);
  console.log(`   ✅ Environment  : ${process.env.NODE_ENV}`);
  console.log(`   ✅ Database     : ${process.env.DATABASE_URL?.split('@')[1]}`);
  console.log('\n   Frontend  → http://localhost:5173');
  console.log('   Admin     → http://localhost:5174\n');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use.`);
    console.error(`   Find the process : netstat -ano | findstr :${PORT}`);
    console.error(`   Kill it          : taskkill /PID <PID> /F\n`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});
