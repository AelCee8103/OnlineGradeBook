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

// After initializing io
app.set('io', io);

// Store connected users
const connectedUsers = new Map();

// Global storage for persistent notifications
// This allows users to receive notifications even when logged out
global.validationResponses = {};

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
      
      // Check for missed notifications for faculty members who were previously offline
      if (userType === 'faculty' && global.validationResponses && global.validationResponses[userID]) {
        console.log(`Found ${global.validationResponses[userID].length} stored notifications for faculty ${userID}`);
        
        // Send missed notifications
        const currentTime = Date.now();
        const missedNotifications = global.validationResponses[userID].filter(notification => {
          // Only send if not expired (within last 30 days)
          return new Date(notification.expiresAt).getTime() > currentTime;
        });
        
        if (missedNotifications.length > 0) {
          console.log(`Sending ${missedNotifications.length} missed notifications to faculty ${userID}`);
          
          // Send each missed notification
          missedNotifications.forEach(notification => {
            // Mark as delivered so we don't send duplicates
            notification.delivered = true;
            
            // Send via multiple channels to ensure delivery
            socket.emit('validationResponseReceived', notification);
            socket.emit('facultyNotification', notification);
          });
          
          // Remove sent notifications from the queue (keep only undelivered ones)
          global.validationResponses[userID] = global.validationResponses[userID].filter(
            notification => !notification.delivered
          );
        }
      }
      
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
  // Modified validation request handler in index.js
socket.on('validationRequest', async (data) => {
  try {
    console.log('Validation request received:', data);
    
    // Make sure faculty details are included
    const facultyID = data.facultyID || socket.userID;
    const facultyName = data.facultyName || connectedUsers.get(facultyID)?.name || 'Unknown Faculty';
    const requestID = data.requestID;
    const advisoryID = data.advisoryID;
    
    // Get active school year - this is crucial
    const db = await connectToDatabase();
    const [activeSchoolYear] = await db.query(
      `SELECT school_yearID, year FROM schoolyear WHERE status = 1 LIMIT 1`
    );
    
    if (activeSchoolYear.length === 0) {
      socket.emit('error', {
        message: 'No active school year found',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    // Create a unique key that includes the school year to prevent duplicates
    const requestKey = `${advisoryID}_${facultyID}_${activeSchoolYear[0].school_yearID}`;
    
    // Check if this is a duplicate request
    if (global.recentValidationRequests && global.recentValidationRequests[requestKey]) {
      console.log(`Ignoring duplicate validation request: ${requestKey}`);
      return;
    }
    
    // Store this request to prevent duplicates
    if (!global.recentValidationRequests) {
      global.recentValidationRequests = {};
    }
    
    global.recentValidationRequests[requestKey] = {
      timestamp: new Date().toISOString(),
      requestID
    };
    
    // Clear this entry after 5 minutes
    setTimeout(() => {
      if (global.recentValidationRequests && global.recentValidationRequests[requestKey]) {
        delete global.recentValidationRequests[requestKey];
      }
    }, 5 * 60 * 1000);
    
    // Enhance the data with school year information
    const enhancedData = {
      ...data,
      facultyID,
      facultyName,
      timestamp: new Date().toISOString(),
      schoolYearID: activeSchoolYear[0].school_yearID,
      schoolYear: activeSchoolYear[0].year
    };
    
    // Find all admin users
    const adminUsers = Array.from(connectedUsers.entries())
      .filter(([_, user]) => user.userType === 'admin');
    
    console.log(`Emitting validation request to ${adminUsers.length} connected admins`);
    
    // Send to each admin
    for (const [adminId, adminInfo] of adminUsers) {
      io.to(adminInfo.socket).emit('newValidationRequest', enhancedData);
    }
    
    // Send confirmation to requesting faculty
    socket.emit('requestConfirmation', {
      success: true,
      message: 'Your validation request has been submitted successfully.',
      schoolYear: activeSchoolYear[0].year
    });
    
  } catch (error) {
    console.error('Error handling validation request:', error);
    socket.emit('error', { 
      message: 'Failed to process validation request',
      error: error.message
    });
  }
});
    // Handle validation responses
  socket.on('validationResponse', (data) => {
    try {
      console.log('Validation response received from admin:', data);
      const timestamp = new Date().toISOString();
      
      // Get admin name who processed this request
      const adminName = socket.userType === 'admin' ? 
        (connectedUsers.get(socket.userID)?.name || 'Admin') : 'Admin';
      
      // Enhanced validation response data
      const enhancedData = {
        ...data,
        processingAdminName: adminName,
        timestamp,
        facultyID: data.facultyID,
        isRealTime: true, // Flag to identify this is a real-time update
        forFaculty: true, // Explicitly mark this for faculty
      };
      
      // Log all connected users for debugging
      console.log('Connected users at time of validation response:', 
        Array.from(connectedUsers.entries()).map(([id, info]) => 
          `${id} (${info.userType}: ${info.name}) - socket: ${info.socket}`
        )
      );
        // Store this validation response in the global store for persistence
      // This ensures faculty members will receive the notification even when logged out
      if (!global.validationResponses[data.facultyID]) {
        global.validationResponses[data.facultyID] = [];
      }
      
      // Add the notification with an expiration date (30 days)
      global.validationResponses[data.facultyID].push({
        ...enhancedData,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        delivered: false
      });
      
      // Find faculty socket - direct notification to the faculty if they're currently online
      const facultyInfo = connectedUsers.get(data.facultyID);
      
      let notificationDelivered = false;
      if (facultyInfo) {
        console.log(`Sending notification to faculty ${data.facultyID} on socket ${facultyInfo.socket}`);
        
        // Send via multiple event types to ensure delivery
        io.to(facultyInfo.socket).emit('validationResponseReceived', enhancedData);
        io.to(facultyInfo.socket).emit('validationStatusUpdate', enhancedData);
        io.to(facultyInfo.socket).emit('facultyNotification', enhancedData);
        
        console.log('Notification sent to faculty socket');
        notificationDelivered = true;
        
        // Mark as delivered in the global store
        global.validationResponses[data.facultyID][global.validationResponses[data.facultyID].length - 1].delivered = true;
      } else {
        console.log(`Faculty ${data.facultyID} not found in connected users - notification will be delivered on next login`);
      }
      
      // Broadcast status update to all faculty with this advisoryID (for multiple tabs/devices)
      const allFacultyUsers = Array.from(connectedUsers.entries())
        .filter(([userId, userInfo]) => userInfo.userType === 'faculty');
          
      console.log(`Broadcasting to ${allFacultyUsers.length} faculty users`);
      
      allFacultyUsers.forEach(([userId, userInfo]) => {
        // Don't skip any faculty - they might be viewing the same advisory on different devices
        io.to(userInfo.socket).emit('validationStatusUpdate', {
          ...enhancedData,
          broadcastToAllFaculty: true
        });
      });
        // Send confirmation feedback to the admin who processed the request
      const confirmationMessage = `${notificationDelivered ? 
        'Notification sent to faculty' : 
        'Faculty is offline. Notification will be delivered when they log in.'
      }`;
      
      // Personalized confirmation for the processing admin
      io.to(socket.id).emit('validationStatusUpdate', {
        ...enhancedData,
        message: `You ${data.status}ed grade validation request from ${data.facultyName || data.facultyID}. ${confirmationMessage}`,
        type: 'action_confirmation',
        forAdmin: true,
        forFaculty: false,
        processingAdmin: true
      });
      
      // Also notify other admins about the status change
      const otherAdmins = Array.from(connectedUsers.entries())
        .filter(([userId, userInfo]) => 
          userInfo.userType === 'admin' && 
          userId !== socket.userID // Skip the admin who processed this
        );
        
      otherAdmins.forEach(([userId, userInfo]) => {
        io.to(userInfo.socket).emit('validationStatusUpdate', {
          ...enhancedData,
          adminID: socket.userID,
          message: `Request ${data.status}ed by ${adminName}`,
          type: 'admin_notification',
          forAdmin: true,
          forFaculty: false
        });
      });
      
      // Log successful notification distribution
      console.log('Validation status updates sent to all relevant users');
      
      // Store the validation response for persistence
      // This allows reconnecting clients to get the latest status
      try {
        const latestResponses = JSON.parse(process.env.LATEST_VALIDATION_RESPONSES || '{}');
        latestResponses[data.advisoryID] = enhancedData;
        process.env.LATEST_VALIDATION_RESPONSES = JSON.stringify(latestResponses);
      } catch (e) {
        console.error('Error storing validation response:', e);
      }
    } catch (error) {
      console.error('Error handling validation response:', error);
    }
  });
  // Handle requests for current validation status
  
  // Handle reconnection events
  socket.on('requestReconnection', (data) => {
    try {
      const { userType, userID, facultyName, adminName } = data;
      console.log(`${userType} reconnection request:`, userID);
      
      // Update socket ID in the connectedUsers map
      const existingUser = connectedUsers.get(userID);
      if (existingUser) {
        existingUser.socket = socket.id;
        console.log(`Updated socket ID for ${userType} ${userID}`);
        
        // Re-attach user info to socket
        socket.userID = userID;
        socket.userType = userType;
        
        socket.emit('reconnected', { success: true });
      } else {
        // If user not found, go through regular authentication
        const userInfo = {
          socket: socket.id,
          userType,
          name: userType === 'faculty' ? facultyName : adminName
        };
        
        connectedUsers.set(userID, userInfo);
        socket.userID = userID;
        socket.userType = userType;
        
        socket.emit('authenticated', { success: true });
      }
    } catch (error) {
      console.error('Reconnection error:', error);
      socket.emit('reconnected', { success: false });
    }
  });

  socket.on('getValidationStatus', async (data) => {
    try {
      console.log('Validation status request received for advisory:', data.advisoryID);
      
      if (!data.advisoryID) {
        return socket.emit('error', { message: 'Missing advisory ID' });
      }
        // Connect to DB and fetch the current status
      const pool = await connectToDatabase();
      const [rows] = await pool.query(
        `SELECT 
           CASE 
             WHEN statusID = 0 THEN 'pending'
             WHEN statusID = 1 THEN 'approved' 
             WHEN statusID = 2 THEN 'rejected'
             ELSE 'unknown'
           END as status, 
           requestID, 
           facultyID, 
           requestDate as timestamp 
         FROM validation_request 
         WHERE advisoryID = ? 
         ORDER BY requestDate DESC LIMIT 1`,
        [data.advisoryID]
      );
      
      if (rows && rows.length > 0) {
        const request = rows[0];
        console.log(`Found validation status for advisory ${data.advisoryID}:`, request);
        
        socket.emit('validationStatusUpdate', {
          advisoryID: data.advisoryID,
          facultyID: request.facultyID,
          status: request.status,
          requestID: request.requestID,
          timestamp: request.timestamp
        });
      } else {
        console.log(`No validation requests found for advisory ${data.advisoryID}`);
        socket.emit('validationStatusUpdate', {
          advisoryID: data.advisoryID,
          status: 'none',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error fetching validation status:', error);
      socket.emit('error', { 
        message: 'Failed to fetch validation status', 
        error: error.message 
      });
    }
  });
  socket.on('disconnect', (reason) => {
    console.log(`Client disconnected (${reason}):`, socket.id);
    
    // Only remove user if this is a final disconnect, not a temporary one
    if (reason === 'io server disconnect' || reason === 'io client disconnect') {
      // Remove user from connected users
      if (socket.userID) {
        connectedUsers.delete(socket.userID);
        console.log(`Removed user ${socket.userID} from connected users`);
        console.log('Remaining connected users:', Array.from(connectedUsers.entries()));
      }
    } else {
      // For transport-related disconnects, keep the user in the list for a while
      console.log(`Temporary disconnect, keeping ${socket.userID} in connected users list`);
      
      // Set a timeout to remove the user if they don't reconnect
      setTimeout(() => {
        // Check if user is still disconnected
        const userInfo = connectedUsers.get(socket.userID);
        if (userInfo && userInfo.socket === socket.id) {
          connectedUsers.delete(socket.userID);
          console.log(`User ${socket.userID} did not reconnect, removing from list`);
        }
      }, 30000); // Wait 30 seconds for reconnection
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
