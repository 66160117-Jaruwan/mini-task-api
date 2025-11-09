const express = require('express');
const dotenv = require('dotenv');
const app = express();

// Load environment variables
dotenv.config();
const db = require('./config/db');

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Mini Task API Running...');
});
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');

app.use('/api/v1/users', userRoutes);
app.use('/api/v1/tasks', taskRoutes);


app.listen(process.env.PORT || 8100, () => {
  console.log(`Server running on port ${process.env.PORT || 8100}`);
});