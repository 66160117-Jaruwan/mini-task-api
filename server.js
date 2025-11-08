// const express = require('express');
// const dotenv = require('dotenv');
// const app = express();
// dotenv.config();
// const db = require('./config/db');

// app.use(express.json());

// app.get('/', (req, res) => {
//   res.send('Mini Task API Running...');
// });
// const userRoutes = require('./routes/userRoutes');
// const taskRoutes = require('./routes/taskRoutes');

// app.use('/api/v1/users', userRoutes);
// app.use('/api/v1/tasks', taskRoutes);


// app.listen(process.env.PORT || 8100, () => {
//   console.log(`Server running on port ${process.env.PORT || 8100}`);
// });

const express = require('express');
const dotenv = require('dotenv');
const app = express();

// Load environment variables
dotenv.config();

// Database connection
const db = require('./config/db');

// Middleware
app.use(express.json());

// Health check route
app.get('/', (req, res) => {
  res.send('Mini Task API Running...');
});

// Import routes
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');

// API Routes - ต้องใช้ /api/v1 เพียงอย่างเดียว
app.use('/api/v1', userRoutes);
app.use('/api/v1', taskRoutes);

// Error Handlers (ต้องอยู่หลัง routes ทั้งหมด)
const { notFoundHandler, errorHandler } = require('./middleware');
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 8100;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});