import dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import authRoutes from './routes/auth.routes.js';
import coursesRoutes from './routes/courses.routes.js';
import testsRoutes from './routes/tests.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import adminRoutes from './routes/admin.routes.js';
import liveClassesRoutes from './routes/liveclasses.routes.js';
import { pool } from './db/index.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ── Swagger / OpenAPI Setup ───────────────────────────────────────────────────
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'SV Logics API',
    version: '1.0.0',
    description: 'REST API for SV Logics — SSC & Banking Exam Prep Platform. Supports students, content managers, and super admins.',
    contact: { name: 'SV Logics Team' },
  },
  servers: [
    { url: `http://localhost:${PORT}/api`, description: 'Development' },
    { url: `${process.env.BACKEND_URL || 'https://your-api-domain.com'}/api`, description: 'Production' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    responses: {
      Unauthorized: {
        description: 'Missing or invalid JWT token',
        content: { 'application/json': { schema: { type: 'object', properties: { error: { type: 'string' } } } } },
      },
      ServerError: {
        description: 'Internal server error',
        content: { 'application/json': { schema: { type: 'object', properties: { error: { type: 'string' } } } } },
      },
    },
    schemas: {
      Student: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          username: { type: 'string' },
          phone: { type: 'string' },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Course: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          title: { type: 'string' },
          slug: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string' },
          price: { type: 'integer', description: 'Price in rupees' },
          isPublished: { type: 'boolean' },
          thumbnailUrl: { type: 'string' },
        },
      },
      MockTest: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          title: { type: 'string' },
          durationMinutes: { type: 'integer' },
          totalQuestions: { type: 'integer' },
          difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
          category: { type: 'string' },
          subject: { type: 'string' },
        },
      },
      LiveClass: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          title: { type: 'string' },
          description: { type: 'string' },
          platform: { type: 'string', enum: ['zoom', 'google_meet'] },
          meetingUrl: { type: 'string', format: 'uri' },
          scheduledAt: { type: 'string', format: 'date-time' },
          durationMinutes: { type: 'integer' },
          isRecurring: { type: 'boolean' },
          recurrenceRule: { type: 'string', example: 'weekly:monday' },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      LiveClassInput: {
        type: 'object',
        required: ['title', 'platform', 'meetingUrl', 'scheduledAt'],
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          platform: { type: 'string', enum: ['zoom', 'google_meet'] },
          meetingUrl: { type: 'string', format: 'uri' },
          scheduledAt: { type: 'string', format: 'date-time' },
          durationMinutes: { type: 'integer', default: 60 },
          isRecurring: { type: 'boolean', default: false },
          recurrenceRule: { type: 'string', example: 'weekly:monday,wednesday' },
          isActive: { type: 'boolean', default: true },
        },
      },
    },
  },
};

const swaggerOptions = {
  swaggerDefinition,
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// ── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet({
  // Allow Swagger UI to load its inline scripts/styles
  contentSecurityPolicy: false,
}));
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
app.use('/api/auth/admin-login', authLimiter);

// ── Body Parser ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Swagger UI ────────────────────────────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'SV Logics API Docs',
  customCss: '.swagger-ui .topbar { background-color: #0f1f3d; } .swagger-ui .topbar-wrapper .link span { display: none; }',
}));
app.get('/api/docs.json', (req, res) => res.json(swaggerSpec));

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
      docs: `http://localhost:${PORT}/api/docs`,
    });
  } catch {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/courses',       coursesRoutes);
app.use('/api/tests',         testsRoutes);
app.use('/api/dashboard',     dashboardRoutes);
app.use('/api/payments',      paymentRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/live-classes',  liveClassesRoutes);

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
  console.log(`   📖 API Docs     : http://localhost:${PORT}/api/docs`);
  console.log(`   ✅ Environment  : ${process.env.NODE_ENV}`);
  console.log(`   ✅ Database     : ${process.env.DATABASE_URL?.split('@')[1]}`);
  console.log('\n   Frontend  → ' + (process.env.FRONTEND_URL || 'http://localhost:PORT'));
  console.log('   Admin     → ' + (process.env.ADMIN_URL    || 'http://localhost:PORT') + '\n');
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
