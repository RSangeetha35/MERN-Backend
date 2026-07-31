require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const rateLimit    = require('express-rate-limit');
const connectDB    = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// ── Routes ────────────────────────────────────────────────────────────────────
const authRoutes         = require('./routes/authRoutes');
const patientRoutes      = require('./routes/patientRoutes');
const appointmentRoutes  = require('./routes/appointmentRoutes');
const doctorRoutes       = require('./routes/doctorRoutes');
const departmentRoutes   = require('./routes/departmentRoutes');
const publicRoutes       = require('./routes/publicRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reviewRoutes       = require('./routes/reviewRoutes');

// ── Connect DB ────────────────────────────────────────────────────────────────
connectDB();

const app = express();

// ── Trust proxy (required on Render / behind a load balancer) ─────────────────
app.set('trust proxy', 1);

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
// Build the allowed-origins list from env + always include localhost for dev
const buildOrigins = () => {
  const origins = new Set([
    'http://localhost:3000',
    'http://localhost:3001',
    'https://localhost:3000',
  ]);

  // CLIENT_URL can be a comma-separated list of allowed origins
  if (process.env.CLIENT_URL) {
    process.env.CLIENT_URL.split(',').forEach(o => origins.add(o.trim()));
  }

  return [...origins];
};

const allowedOrigins = buildOrigins();

app.use(cors({
  origin: (origin, cb) => {
    // Allow non-browser requests (Postman, Render health checks, server-to-server)
    if (!origin) return cb(null, true);

    // In production allow any *.onrender.com subdomain automatically
    if (
      allowedOrigins.includes(origin) ||
      /^https:\/\/.*\.onrender\.com$/.test(origin) ||
      process.env.NODE_ENV !== 'production'
    ) {
      return cb(null, true);
    }

    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── HTTP logger ───────────────────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Global rate limiter ───────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// Stricter limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts, please try again in 15 minutes.' },
});

app.use('/api', globalLimiter);
app.use('/api/auth', authLimiter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.status(200).json({
    success: true,
    status:  'HMS API running',
    env:     process.env.NODE_ENV,
    time:    new Date().toISOString(),
  })
);

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/patients',      patientRoutes);
app.use('/api/appointments',  appointmentRoutes);
app.use('/api/doctors',       doctorRoutes);
app.use('/api/departments',   departmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews',       reviewRoutes);
app.use('/api',               publicRoutes);   // catch-all public routes last

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) =>
  res.status(404).json({ success: false, message: 'Route not found.' })
);

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`HMS API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

module.exports = app;
