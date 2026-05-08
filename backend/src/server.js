const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { initSocket } = require('./utils/socketManager');
const { errorHandler } = require('./middleware/errorMiddleware');
const { protect } = require('./middleware/authMiddleware');

// Routes
const authRoutes = require('./routes/authRoutes');
const alertRoutes = require('./routes/alertRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');

// Load env vars
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});
initSocket(io);

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req, res) => {
  res.json({ message: '🚨 DUT Security API is running', status: 'OK' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// Socket stats endpoint
app.get('/api/stats', protect, async (req, res) => {
  const { getConnectedUsers } = require('./utils/socketManager');
  const Alert = require('./models/Alert');
  const Incident = require('./models/Incident');
  const User = require('./models/User');

  const [totalAlerts, activeAlerts, totalIncidents, totalUsers] = await Promise.all([
    Alert.countDocuments(),
    Alert.countDocuments({ status: 'active' }),
    Incident.countDocuments(),
    User.countDocuments(),
  ]);

  res.json({
    success: true,
    stats: {
      connectedUsers: getConnectedUsers().size,
      totalAlerts,
      activeAlerts,
      totalIncidents,
      totalUsers,
    },
  });
});
// Error Handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO ready`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});