import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import supabase from './config/supabase.js';
import {
  User,
  Course,
  Enrollment,
  LessonProgress,
  QuizAttempt,
  Certificate,
  Notification,
  ChatHistory,
  SiteContent,
  PricingPlan,
  Subscription
} from './models/index.js';

// Import routes
import authRoutes from './routes/auth.js';
import courseRoutes from './routes/courses.js';
import enrollmentRoutes from './routes/enrollments.js';
import notificationRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';
import siteContentRoutes from './routes/siteContent.js';

const app = express();

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins in development
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Verify Supabase connection
supabase.from('users').select('id').limit(1)
  .then(() => console.log('✅ Supabase Connected.'))
  .catch(err => console.error(`❌ Error connecting to Supabase: ${err.message}`));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Lekol Alèz API is running',
    timestamp: new Date().toISOString()
  });
});

// Debug route to check token
app.get('/api/debug/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.json({ error: 'No token', hasToken: false });
    }

    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(token, process.env.JWT_SECRET || 'fallback-secret-change-me');
    const user = await User.findById(decoded.id).select('-password');

    res.json({
      hasToken: true,
      decoded,
      user: user ? { id: user._id, email: user.email, role: user.role, firstName: user.firstName } : null
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});

// Test database connection route
app.get('/api/test-db', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const courseCount = await Course.countDocuments();

    res.json({
      status: 'Connected',
      database: 'Supabase (PostgreSQL)',
      tables: {
        users: userCount,
        courses: courseCount
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: error.message
    });
  }
});

// Example: Create a test user route
app.post('/api/test-user', async (req, res) => {
  try {
    const testUser = await User.create({
      email: 'test@lekolalez.com',
      password: 'test123456',
      firstName: 'Test',
      lastName: 'User',
      role: 'student',
      preferredLanguage: 'ht'
    });

    res.status(201).json({
      message: 'Test user created successfully',
      user: {
        id: testUser._id,
        email: testUser.email,
        fullName: testUser.fullName,
        role: testUser.role
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'User already exists' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/site-content', siteContentRoutes);

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════╗
  ║                                                   ║
  ║   Lekol Alez API Server                           ║
  ║   Running on: http://localhost:${PORT}              ║
  ║                                                   ║
  ╚═══════════════════════════════════════════════════╝
  `);
});

export default app;
