import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRouter from './routes/authroutes.js';
import Pages from './routes/Pages.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Configure CORS before initializing Socket.IO
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Add these before initializing Socket.IO
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || 'http://localhost:5173');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Initialize Socket.IO with proper CORS configuration
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  transports: ['polling', 'websocket'],
  pingInterval: 10000,
  pingTimeout: 5000,
  connectTimeout: 10000,
  allowEIO3: true,
  cookie: false,
  maxHttpBufferSize: 1e8,
  path: '/socket.io/'
});

// Store connected users
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('authenticate', async (data) => {
    try {
      const { userType, userID, facultyName, adminName } = data;
      console.log(`${userType} authentication attempt:`, userID);
      
      // Store user connection info
      const userInfo = {
        socket: socket.id,
        userType,
        name: userType === 'faculty' ? facultyName : adminName
      };
      
      connectedUsers.set(userID, userInfo);
      socket.userID = userID;
      socket.userType = userType;

      console.log(`${userType} authenticated successfully:`, userID);
      socket.emit('authenticated', { success: true });
      
      // Log current connected users
      console.log('Connected users:', Array.from(connectedUsers.entries()));
    } catch (error) {
      console.error('Authentication error:', error);
      socket.emit('authenticated', { 
        success: false, 
        error: 'Authentication failed' 
      });
    }
  });

  // Handle validation requests
  socket.on('validationRequest', async (data) => {
    try {
      console.log('Validation request received:', data);
      
      // Find all admin sockets
      const adminUsers = Array.from(connectedUsers.entries())
        .filter(([_, user]) => user.userType === 'admin');

      console.log('Connected admins:', adminUsers);

      // Emit to all connected admins
      for (const [adminId, adminInfo] of adminUsers) {
        console.log(`Sending notification to admin ${adminId}`);
        io.to(adminInfo.socket).emit('newValidationRequest', {
          ...data,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error handling validation request:', error);
      socket.emit('error', { message: 'Failed to process validation request' });
    }
  });

  // Handle validation responses
  socket.on('validationResponse', (data) => {
    try {
      console.log('Validation response:', data);
      
      // Find faculty socket
      const facultyInfo = connectedUsers.get(data.facultyID);
      
      if (facultyInfo) {
        console.log(`Sending notification to faculty ${data.facultyID}`);
        io.to(facultyInfo.socket).emit('validationResponseReceived', {
          ...data,
          timestamp: new Date().toISOString()
        });
      } else {
        console.error(`Faculty ${data.facultyID} not found in connected users`);
      }
    } catch (error) {
      console.error('Error handling validation response:', error);
    }
  });

  socket.on('disconnect', () => {
    if (socket.userID) {
      connectedUsers.delete(socket.userID);
      console.log('User disconnected:', socket.userID);
      console.log('Remaining connected users:', Array.from(connectedUsers.entries()));
    }
  });
});

app.use(express.json());
app.use('/auth', authRouter);
app.use('/Pages', Pages);

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
