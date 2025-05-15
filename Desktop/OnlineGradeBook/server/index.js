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
// Temporary storage for pending notifications
let pendingNotifications = [];

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Handle validation responses
  socket.on('validationResponse', (data) => {
    try {
      console.log('Validation response from admin:', data);
      
      // Log all connected users for debugging
      console.log('All connected users before lookup:', Array.from(connectedUsers.entries())
        .map(([id, info]) => ({ id, type: info.userType, socketId: info.socket })));
      
      // Find faculty socket - using toString() to ensure consistent type comparison
      const facultyID = data.facultyID.toString();
      
      // Look through all connected sockets to find our faculty
      let facultySocket = null;
      
      for (const [userId, userInfo] of connectedUsers.entries()) {
        console.log(`Checking user ${userId} (${typeof userId}) against faculty ${facultyID} (${typeof facultyID})`);
        if (userId.toString() === facultyID) {
          facultySocket = userInfo.socket;
          break;
        }
      }
      
      if (facultySocket) {
        console.log(`Found faculty ${facultyID} with socket ${facultySocket}`);
        
        // Use the socket ID to send notification
        io.to(facultySocket).emit('validationResponseReceived', {
          requestID: data.requestID,
          facultyID: data.facultyID,
          advisoryID: data.advisoryID,
          status: data.status,
          message: data.message,
          timestamp: data.timestamp,
          Grade: data.Grade,
          Section: data.Section,
          schoolYear: data.schoolYear
        });
        
        console.log('Notification sent successfully to faculty');
      } else {
        console.error(`Faculty ${facultyID} not found in connected users despite being in the list. Broadcasting to all faculty...`);
        
        // Fallback: Try to find all faculty users and send to them
        const facultyUsers = Array.from(connectedUsers.entries())
          .filter(([id, info]) => info.userType === 'faculty');
          
        console.log(`Found ${facultyUsers.length} total faculty users, attempting broadcast`);
        
        // Broadcast to all faculty as a fallback
        for (const [id, info] of facultyUsers) {
          if (id.toString() === facultyID.toString()) {
            console.log(`Broadcasting message to faculty ${id} via socket ${info.socket}`);
            io.to(info.socket).emit('validationResponseReceived', {
              requestID: data.requestID,
              facultyID: data.facultyID,
              advisoryID: data.advisoryID,
              status: data.status,
              message: data.message,
              timestamp: data.timestamp,
              Grade: data.Grade,
              Section: data.Section,
              schoolYear: data.schoolYear
            });
          }
        }
        
        // Store the notification for delivery when faculty reconnects
        pendingNotifications.push({
          type: 'validationResponse',
          recipientID: data.facultyID.toString(),
          data: data,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Error handling validation response:', error);
    }
  });

  // Fix the authentication handler to ensure consistent types
  socket.on('authenticate', (userData) => {
    try {
      const userId = userData.userID.toString(); // Ensure string format
      console.log(`User authenticating: ${userData.userType} - ${userId}`);
      
      // Store user connection info with consistent string IDs
      connectedUsers.set(userId, {
        socket: socket.id,
        userType: userData.userType,
        name: userData.userType === 'faculty' ? userData.facultyName : userData.adminName
      });
      
      // Store user info directly on the socket object too for redundancy
      socket.userID = userId;
      socket.userType = userData.userType;
      
      // Confirm successful authentication
      socket.emit('authenticated', { success: true });
      
      // If user is faculty, check for pending notifications
      if (userData.userType === 'faculty') {
        const pendingForUser = pendingNotifications.filter(
          notif => notif.recipientID.toString() === userId
        );
        
        if (pendingForUser.length > 0) {
          console.log(`Delivering ${pendingForUser.length} pending notifications to faculty ${userId}`);
          
          // Send each pending notification
          for (const notification of pendingForUser) {
            if (notification.type === 'validationResponse') {
              socket.emit('validationResponseReceived', notification.data);
            }
          }
          
          // Remove delivered notifications
          pendingNotifications = pendingNotifications.filter(
            notif => notif.recipientID.toString() !== userId
          );
        }
      }
      
      console.log(`Current connected users: ${connectedUsers.size}`);
      console.log('Connected users:', Array.from(connectedUsers.entries())
        .map(([id, info]) => ({ id, type: info.userType, socketId: info.socket })));
    } catch (error) {
      console.error('Error during authentication:', error);
      socket.emit('authenticated', { success: false, error: error.message });
    }
  });

  // Also update the disconnect handler to use consistent types
  socket.on('disconnect', () => {
    if (socket.userID) {
      console.log(`User disconnecting: ${socket.userID} (${socket.userType})`);
      connectedUsers.delete(socket.userID.toString());
      console.log('Remaining connected users:', Array.from(connectedUsers.entries())
        .map(([id, info]) => ({ id, type: info.userType, socketId: info.socket })));
    } else {
      console.log('Anonymous socket disconnected');
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
