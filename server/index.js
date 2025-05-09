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

// Update CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

app.use(cors(corsOptions));

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

// Update Socket.IO CORS configuration
const io = new Server(httpServer, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  pingInterval: 10000,
  pingTimeout: 5000
});

// Store connected users
const connectedUsers = new Map();

// Update the socket.io connection handler in index.js
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Authentication timeout
  const authTimeout = setTimeout(() => {
    if (!socket.userID) {
      console.log('Authentication timeout, disconnecting:', socket.id);
      socket.disconnect(true);
    }
  }, 10000); // 10 seconds timeout

  socket.on('authenticate', async (data) => {
    try {
      clearTimeout(authTimeout);
      const { userType, userID, facultyName, adminName } = data;
      console.log(`${userType} authentication attempt:`, userID);
      
      // Simple validation
      if (!userID || !userType) {
        throw new Error('Invalid authentication data');
      }

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
      socket.disconnect(true);
    }
  });

  // Handle validation requests
  socket.on('validationRequest', async (data) => {
    try {
      if (!socket.userID || socket.userType !== 'faculty') {
        throw new Error('Unauthorized');
      }

      console.log('Validation request received:', data);
      
      // Find all admin sockets
      const adminUsers = Array.from(connectedUsers.entries())
        .filter(([_, user]) => user.userType === 'admin');

      console.log('Connected admins:', adminUsers);

      if (adminUsers.length === 0) {
        console.log('No admins connected to notify');
        return;
      }

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
  socket.on('validationResponse', async (data) => {
    try {
      if (!socket.userID || socket.userType !== 'admin') {
        throw new Error('Unauthorized');
      }

      const { facultyID, status, requestID, message } = data;
      const facultySocket = Array.from(connectedUsers.entries())
        .find(([id, user]) => id === facultyID)?.[1]?.socket;

      if (facultySocket) {
        io.to(facultySocket).emit('validationResponseReceived', {
          status,
          requestID,
          message,
          timestamp: new Date().toISOString()
        });
      }

      // Broadcast the status update to all admin users
      const adminSockets = Array.from(connectedUsers.entries())
        .filter(([_, user]) => user.userType === 'admin')
        .map(([_, user]) => user.socket);

      adminSockets.forEach(adminSocket => {
        io.to(adminSocket).emit('validationStatusUpdate', {
          requestID,
          status,
          timestamp: new Date().toISOString()
        });
      });

    } catch (error) {
      console.error('Error handling validation response:', error);
      socket.emit('error', { message: 'Failed to process validation response' });
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
