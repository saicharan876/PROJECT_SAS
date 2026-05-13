require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Import Routers
const authRouter = require('./routers/auth_router');
const cvRouter = require('./routers/cv_router');
const atsRouter = require('./routers/ats_router');
const assignmentRouter = require('./routers/assignment_router');
const scholarshipRouter = require('./routers/scholarship_router');
const contestRouter = require('./routers/contest_router');
const taskRouter = require('./routers/task_router');

const app = express();
const PORT = process.env.PORT || 5000;

// ========================
// Middleware
// ========================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// ========================
// API Routes
// ========================
app.use('/api/auth', authRouter);
app.use('/api/cv', cvRouter);
app.use('/api/ats', atsRouter);
app.use('/api/assignments', assignmentRouter);
app.use('/api/scholarships', scholarshipRouter);
app.use('/api/contests', contestRouter);
app.use('/api/tasks', taskRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ========================
// Global Error Handler
// ========================
app.use((err, req, res, next) => {
  console.error('🔥 Unhandled Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// ========================
// Start Server
// ========================
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 SERVER SAS running on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV}`);
  });
};

startServer();
