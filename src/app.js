import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes
import amcRoutes from './routes/amc.routes.js';
import fundRoutes from './routes/fund.routes.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import demoRoutes from './routes/demo.routes.js';
import calculatorRoutes from './routes/calculator.routes.js';
import schedulerRoutes from './routes/scheduler.routes.js';
import ingestionRoutes from './routes/ingestion.routes.js';
import cronRoutes from './routes/cron.routes.js';
import adminRoutes from './routes/admin.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import logRoutes from './routes/log.routes.js';
import supportRoutes from './routes/support.routes.js';

// Middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.middleware.js'; // [NEW] Logger

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  hsts: false, // Disable HSTS for local HTTP usage
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.mfapi.in", "http://localhost:4000", "ws://localhost:4000", "https://*.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:", "https://pagead2.googlesyndication.com", "blob:"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      frameSrc: ["'self'", "https://googleads.g.doubleclick.net"],
      upgradeInsecureRequests: null, // Explicitly disable auto-upgrade to HTTPS
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? false // In production, served from same origin
    : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true
}));

// [NEW] Request Logger (Files + Console) - Placed before morgan/body-parser to capture raw request data if needed
// but usually after body parser if we want to log body (careful with PII).
// For timing, earlier is better.
app.use(requestLogger);

// Request logging (Morgan for dev console backup)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  message: {
    success: false,
    error: 'Too many requests. Please wait and try again.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api', limiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/amcs', amcRoutes);
app.use('/api/funds', fundRoutes);
app.use('/api/calculator', calculatorRoutes);
app.use('/api/scheduler', schedulerRoutes);
app.use('/api/ingestion', ingestionRoutes);
app.use('/api/cron', cronRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/support', supportRoutes); // Report Issue feature
app.use('/api/health', healthRoutes);

// Root route - API info
// Root route - API info
// In production, this is handled by the React frontend
// In development, we show this JSON info
if (process.env.NODE_ENV !== 'production') {
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'MF Selection API',
      version: '1.0.0',
      endpoints: {
        health: '/api/health',
        // ... (truncated for brevity, keep the logic if needed or just redirect)
        documentation: 'See README.md for API documentation',
        frontend: 'http://localhost:5173'
      }
    });
  });
} else {
  // In production, also serve API info at /api
  app.get('/api', (req, res) => {
    res.json({
      success: true,
      message: 'MF Selection API',
      version: '1.0.0',
      docs: 'This is the API root. Frontend is at /'
    });
  });
}

// Serve static files from React build in production
const clientDistPath = path.join(__dirname, '../client/dist');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(clientDistPath));

  // SPA fallback - serve index.html for all non-API routes in production
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
      if (err) {
        next();
      }
    });
  });
}

// 404 handler for undefined API routes
app.use('/api/*', notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
