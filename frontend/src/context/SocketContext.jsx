import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Clear any existing sockets first
    if (socket) {
      socket.disconnect();
    }

    // Create a fresh socket connection
    try {
      const newSocket = io('http://localhost:3000', {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 20000,
        withCredentials: true,
        autoConnect: true
      });

      // Function to authenticate the socket
      const authenticateSocket = (socket, isReconnect = false) => {
        try {
          const facultyID = localStorage.getItem('facultyID');
          const adminID = localStorage.getItem('adminID');
          const facultyName = localStorage.getItem('facultyName');
          const adminName = localStorage.getItem('adminName');
          
          const eventName = isReconnect ? 'requestReconnection' : 'authenticate';
          
          if (facultyID) {
            console.log(`${isReconnect ? 'Reconnecting' : 'Authenticating'} as faculty:`, facultyID);
            socket.emit(eventName, {
              userType: 'faculty',
              userID: facultyID,
              facultyName,
              isFaculty: true
            });
          } else if (adminID) {
            console.log(`${isReconnect ? 'Reconnecting' : 'Authenticating'} as admin:`, adminID);
            socket.emit(eventName, {
              userType: 'admin',
              userID: adminID,
              adminName,
              isAdmin: true
            });
          }
        } catch (err) {
          console.error("Authentication error:", err);
        }
      };

      // Track reconnection attempts
      let reconnectAttempts = 0;
      let wasConnected = false;

      newSocket.on('connect', () => {
        console.log('Socket connected');
        
        // If this is a reconnection
        if (wasConnected) {
          console.log(`Reconnected after ${reconnectAttempts} attempts`);
          authenticateSocket(newSocket, true);
          reconnectAttempts = 0;
        } else {
          // First connection
          authenticateSocket(newSocket);
          wasConnected = true;
        }
      });
      
      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        reconnectAttempts++;
      });
      
      newSocket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`Reconnection attempt ${attemptNumber}`);
      });
      
      newSocket.on('reconnect_failed', () => {
        console.error('Failed to reconnect after all attempts');
      });

      // Set the socket state
      setSocket(newSocket);

      return () => {
        if (newSocket) {
          console.log("Cleaning up socket connection...");
          newSocket.disconnect();
        }
      };
    } catch (error) {
      console.error("Error initializing socket:", error);
    }
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  try {
    const socket = useContext(SocketContext);
    return socket; // This can be null, the component should handle it
  } catch (e) {
    console.warn('Error using socket context:', e);
    return null;
  }
};

export default SocketContext;