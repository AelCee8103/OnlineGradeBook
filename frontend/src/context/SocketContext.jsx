import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);  useEffect(() => {
    if (!socket) return;
    
    // Add a small delay to ensure connection is established before authenticating
    setTimeout(() => {
      const facultyID = localStorage.getItem('facultyID');
      const facultyName = localStorage.getItem('facultyName');
      const adminID = localStorage.getItem('adminID');
      const adminName = localStorage.getItem('adminName');

  if (facultyID && facultyName) {
    socket.emit('authenticate', {
      userType: 'faculty',
      userID: facultyID,
      facultyName: facultyName
    });
  } else if (adminID && adminName) {
    socket.emit('authenticate', {
      userType: 'admin',
      userID: adminID,
      adminName: adminName
    });
  }

  const handleValidationResponse = (data) => {
    console.log('Validation response received:', data);
    // This will trigger the notification dropdown
  };
  socket.on('validationResponseReceived', handleValidationResponse);
      
    }, 300); // 300ms delay for authentication after socket connection
    
    return () => {
      socket.off('validationResponseReceived', handleValidationResponse);
    };
  }, [socket]);

  useEffect(() => {
    // Only create socket if it doesn't exist
    if (!socket) {
      console.log('Creating new socket connection...');
      
      // Close any existing sockets to avoid duplicate connections
      if (socket) {
        socket.disconnect();
      }
      
      const newSocket = io('http://localhost:3000', {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        timeout: 30000,
        autoConnect: true,
        forceNew: true // Force a new connection to avoid duplicates
      });

      newSocket.on('connect', () => {
        console.log('Socket connected successfully');
        setIsConnected(true);        // Get user information from localStorage
        const facultyID = localStorage.getItem('facultyID');
        const facultyName = localStorage.getItem('facultyName');
        const adminID = localStorage.getItem('adminID');
        const adminName = localStorage.getItem('adminName');

          // Authenticate based on available user data
          if (facultyID && facultyName) {
            newSocket.emit('authenticate', {
              userType: 'faculty',
              userID: facultyID,
              facultyName: facultyName
            });
          } else if (adminID && adminName) {
            newSocket.emit('authenticate', {
              userType: 'admin',
              userID: adminID,
              adminName: adminName
            });
          }
        });
         // In SocketContext.jsx
        newSocket.on('reconnect', (attempt) => {
          console.log(`Reconnected after ${attempt} attempts`);
          // Re-authenticate
          const facultyID = localStorage.getItem('facultyID');
          const facultyName = localStorage.getItem('facultyName');
          const adminID = localStorage.getItem('adminID');
          const adminName = localStorage.getItem('adminName');
          
          if (facultyID && facultyName) {
            newSocket.emit('authenticate', {
              userType: 'faculty',
              userID: facultyID,
              facultyName: facultyName
            });
          } else if (adminID && adminName) {
            newSocket.emit('authenticate', {
              userType: 'admin',
              userID: adminID,
              adminName: adminName
            });
          } else {
            console.warn('No user credentials found for socket authentication on reconnect');
          }
        });      newSocket.on('disconnect', (reason) => {
        console.log(`Socket disconnected: ${reason}`);
        setIsConnected(false);
        
        // Only try to reconnect if it was not an intentional disconnect
        if (reason === 'io server disconnect' || reason === 'io client disconnect') {
          // The server intentionally disconnected us or we disconnected intentionally
          console.log('Disconnected by server or client. Not attempting auto-reconnect.');
        }
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });
      
      // Use connect_timeout event to handle connection timeouts
      newSocket.on('connect_timeout', () => {
        console.error('Socket connection timeout');
        setIsConnected(false);
      });
      
      // Handle reconnection attempts
      newSocket.io.on('reconnect_attempt', (attemptNumber) => {
        console.log(`Socket reconnection attempt ${attemptNumber}`);
      });
      
      // Handle reconnect errors
      newSocket.io.on('reconnect_error', (error) => {
        console.error('Socket reconnection error:', error);
      });

      setSocket(newSocket);

      // Cleanup function
      return () => {
        if (newSocket) {
          // Remove all listeners to avoid memory leaks
          newSocket.off('connect');
          newSocket.off('disconnect');
          newSocket.off('connect_error');
          newSocket.off('connect_timeout');
          newSocket.off('reconnect');
          newSocket.io.off('reconnect_attempt');
          newSocket.io.off('reconnect_error');
          
          // Only disconnect if connected
          if (newSocket.connected) {
            console.log('Closing socket connection on component unmount');
            newSocket.disconnect();
          }
          
          newSocket.close();
        }
      };
    }
  }, []); // Empty dependency array

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const socket = useContext(SocketContext);
  // Only warn in development to avoid console spam in production
  if (!socket && process.env.NODE_ENV !== 'production') {
    console.warn('useSocket must be used within a SocketProvider');
  }
  return socket;
};

export default SocketContext;