import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRouter from './routes/authroutes.js';
import Pages from './routes/Pages.js';
import dotenv from 'dotenv';
import { connectToDatabase } from './lib/db.js';

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

// Make io accessible to routes
app.set('socketio', io);

// Store connected users
const connectedUsers = new Map();

// Update the socket.io connection handler in index.js
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Add error handler
  socket.on('error', (error) => {
    console.error('Socket error:', error);
    socket.emit('socketError', { message: 'Connection error. Please refresh the page.' });
  });

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
      
      // Add logging to diagnose authentication issues
      console.log('Received authentication data:', JSON.stringify(data, null, 2));
      
      const { userType, userID, facultyName, adminName } = data;
      console.log(`${userType} authentication attempt:`, userID);
      
      // Enhanced validation with more detailed error messages
      if (!userID) {
        console.error('Authentication failed: Missing userID');
        socket.emit('socketError', { message: 'Authentication failed: Missing user ID' });
        return;
      }
      
      if (!userType || (userType !== 'faculty' && userType !== 'admin')) {
        console.error('Authentication failed: Invalid userType:', userType);
        socket.emit('socketError', { message: 'Authentication failed: Invalid user type' });
        return;
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
      
      // Send authentication success message back to client
      socket.emit('authenticationSuccess', { 
        userID,
        userType,
        message: `Successfully authenticated as ${userType}` 
      });

      // Add user to appropriate rooms
      if (userType === 'admin') {
        socket.join('admins'); // All admins room
        socket.join(`admin_${userID}`); // Private admin room
      } else if (userType === 'faculty') {
        socket.join(`faculty_${userID}`); // Private faculty room
      }

      console.log(`${userType} authenticated successfully:`, userID);
      socket.emit('authenticated', { success: true });
      
      // For admins, send initial requests immediately after auth
      if (userType === 'admin') {
        socket.emit('getInitialRequests');
      }

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

  // Handle initial requests for admins
  socket.on('getInitialRequests', async () => {
    try {
      if (!socket.userID || socket.userType !== 'admin') {
        throw new Error('Unauthorized');
      }

      const db = await connectToDatabase();
      const [requests] = await db.query(`
        SELECT 
          vr.requestID,
          vr.advisoryID,
          vr.facultyID,
          vr.requestDate,
          CONCAT(f.LastName, ', ', f.FirstName) AS facultyName,
          c.Grade,
          c.Section,
          sy.year AS schoolYear
        FROM validation_request vr
        JOIN faculty f ON vr.facultyID = f.FacultyID
        JOIN advisory a ON vr.advisoryID = a.advisoryID
        JOIN classes c ON a.classID = c.ClassID
        JOIN class_year cy ON a.advisoryID = cy.advisoryID
        JOIN schoolyear sy ON cy.yearID = sy.school_yearID
        WHERE vr.statusID = 0
        ORDER BY vr.requestDate DESC
      `);

      socket.emit('initialRequests', {
        requests: requests.map(req => ({
          ...req,
          requestDate: new Date(req.requestDate).toLocaleString()
        }))
      });
    } catch (error) {
      console.error('Error fetching initial requests:', error);
      socket.emit('socketError', { message: 'Failed to load requests' });
    }
  });

  // Handle validation requests from faculty
  socket.on('validationRequest', async (data) => {
    try {
      if (!socket.userID || socket.userType !== 'faculty') {
        throw new Error('Unauthorized');
      }

      console.log('Validation request received:', data);
        // Broadcast detailed notification to all admins through the 'admins' room
      io.to('admins').emit('newValidationRequest', {
        ...data,
        message: `Faculty ${data.facultyName} has requested grade validation for Grade ${data.grade} - ${data.section}`,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error handling validation request:', error);
      socket.emit('error', { message: 'Failed to process validation request' });
    }
  });

  // Handle validation responses from admins  // This handler is now deprecated - validation processing is handled directly in Pages.js route
  socket.on('validationResponse', async (data) => {
    try {
      if (!socket.userID || socket.userType !== 'admin') {
        throw new Error('Unauthorized');
      }
        console.log('Received validation response via socket, but this is now handled by the HTTP endpoint');
      // No action needed here - removed to prevent duplicate notifications
      // The HTTP endpoint in Pages.js now handles all notification sending
      
      /* Disabled to prevent duplicate notifications:
      const db = await connectToDatabase();
      const [request] = await db.query(
        'SELECT * FROM validation_request WHERE requestID = ?',
        [data.requestID]
      );
      */    } catch (error) {
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