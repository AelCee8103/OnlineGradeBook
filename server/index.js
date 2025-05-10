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
      const { userType, userID, facultyName, adminName } = data;
      console.log(`${userType} authentication attempt:`, userID);
      
      // Enhanced validation
      if (!userID || !userType) {
        throw new Error('Invalid authentication data');
      }
      
      if (userType === 'faculty' && (!facultyName)) {
        throw new Error('Missing faculty information');
      }
      
      if (userType === 'admin' && (!adminName)) {
        throw new Error('Missing admin information');
      }

      // Store user connection info with more details
      const userInfo = {
        socket: socket.id,
        userType,
        name: userType === 'faculty' ? facultyName : adminName,
        connectionTime: new Date(),
        lastActivity: new Date()
      };
      
      connectedUsers.set(userID, userInfo);
      socket.userID = userID;
      socket.userType = userType;

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
      
      // Broadcast to all admins through the 'admins' room
      io.to('admins').emit('newValidationRequest', {
        ...data,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error handling validation request:', error);
      socket.emit('error', { message: 'Failed to process validation request' });
    }
  });

  // Handle validation responses from admins
  // In your validationResponse handler in index.js
socket.on('validationResponse', async (data) => {
  try {
    if (!socket.userID || socket.userType !== 'admin') {
      throw new Error('Unauthorized');
    }

    const db = await connectToDatabase();
    
    // Verify and update the request in database
    const [result] = await db.query(
      'UPDATE validation_request SET statusID = ?, processedBy = ?, processedDate = NOW() ' +
      'WHERE requestID = ? AND statusID = 0',
      [
        data.status === 'approve' ? 1 : 2,
        socket.userID,
        data.requestID
      ]
    );

    if (result.affectedRows === 0) {
      throw new Error('Request not found or already processed');
    }

    // Get updated request details
    const [request] = await db.query(
      `SELECT vr.facultyID, vr.advisoryID, 
        CONCAT(f.FirstName, ' ', f.LastName) as facultyName,
        c.Grade, c.Section
       FROM validation_request vr
       JOIN faculty f ON vr.facultyID = f.FacultyID
       JOIN advisory a ON vr.advisoryID = a.advisoryID
       JOIN classes c ON a.classID = c.ClassID
       WHERE vr.requestID = ?`,
      [data.requestID]
    );

    if (request.length > 0) {
      const reqData = request[0];
      
      // Broadcast to all admins
      io.to('admins').emit('validationStatusUpdate', {
        requestID: data.requestID,
        status: data.status,
        timestamp: new Date().toISOString()
      });

      // Notify specific faculty member
      io.to(`faculty_${reqData.facultyID}`).emit('validationResponseReceived', {
        status: data.status,
        requestID: data.requestID,
        message: data.message || `Your validation request for Grade ${reqData.Grade}-${reqData.Section} has been ${data.status}d`,
        timestamp: new Date().toISOString(),
        advisoryID: reqData.advisoryID
      });
    }
  } catch (error) {
    console.error('Error handling validation response:', error);
    socket.emit('validationError', { 
      message: 'Failed to process validation response' 
    });
  }
});
  // Add handler for getValidationStatus
  socket.on('getValidationStatus', async (data) => {
    try {
      if (!socket.userID || socket.userType !== 'faculty') {
        throw new Error('Unauthorized');
      }

      if (!data.advisoryID) {
        throw new Error('Advisory ID is required');
      }

      const db = await connectToDatabase();
      
      const [results] = await db.query(
        `SELECT 
          vr.requestID, vr.statusID, vr.requestDate, vr.processedDate
        FROM validation_request vr
        WHERE vr.advisoryID = ? 
        ORDER BY vr.requestDate DESC 
        LIMIT 1`,
        [data.advisoryID]
      );

      // Send response directly to the requesting faculty
      if (results.length > 0) {
        const status = 
          results[0].statusID === 0 ? 'pending' : 
          results[0].statusID === 1 ? 'approved' : 'rejected';
        
        socket.emit('validationStatus', {
          status,
          requestID: results[0].requestID,
          timestamp: new Date().toISOString(),
          advisoryID: data.advisoryID
        });
      } else {
        // No validation requests found
        socket.emit('validationStatus', {
          status: null, 
          advisoryID: data.advisoryID
        });
      }
    } catch (error) {
      console.error('Error getting validation status:', error);
      socket.emit('validationError', { 
        message: 'Failed to fetch validation status' 
      });
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