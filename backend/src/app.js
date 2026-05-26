/**
 * Express Application Configuration
 * Sets up middleware, routes, and error handling
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const leadRoutes = require('./routes/leadRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const withdrawalRoutes = require('./routes/withdrawalRoutes');
const companyProfileRoutes = require('./routes/companyProfileRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const errorHandler = require('./middleware/errorHandler');
const { serialize } = require('./helpers/serializationHelper');

const app = express();

// ---- Serialization Middleware (Industrial Standards) ----
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (body) {
    if (body) {
      body = serialize(body);
    }
    return originalJson.call(this, body);
  };
  next();
});

// ---- Security Middleware ----
app.use(helmet());
const allowedOrigins = [
  'https://oneassist.net.in',
  'https://one.net.in',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map(o => o.trim()) : []),
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ---- Request Parsing ----
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// ---- Logging ----
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ---- Health Check ----
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ---- API Routes ----
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/invoice-requests', invoiceRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/company-profile', companyProfileRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ---- Mobile App Routes (root-level, no auth required) ----
const invoiceController = require('./controllers/invoiceController');
app.post('/submitInvoiceRequest', invoiceController.submitRequest);
app.get('/getInvoiceRequestsByConnector', invoiceController.getByConnector);

// Withdrawal mobile routes
const withdrawalController = require('./controllers/withdrawalController');
app.post('/submitWithdrawalRequest', withdrawalController.submitRequest);
app.get('/getWithdrawalsByConnector', withdrawalController.getByConnector);

// ---- 404 Handler ----
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// ---- Global Error Handler ----
app.use(errorHandler);

module.exports = app;
