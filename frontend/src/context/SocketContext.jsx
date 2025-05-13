import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      withCredentials: true,
      autoConnect: true
    });    // Function to authenticate the socket
    const authenticateSocket = (socket, isReconnect = false) => {
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
          // Add explicit role flag for better filtering
          isFaculty: true
        });} else if (adminID) {
        console.log(`${isReconnect ? 'Reconnecting' : 'Authenticating'} as admin:`, adminID);
        socket.emit(eventName, {
          userType: 'admin',
          userID: adminID,
          adminName,
          // Add explicit role flag for better filtering
          isAdmin: true
        });
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
    });    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      reconnectAttempts++;
    });
    
    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Reconnection attempt ${attemptNumber}`);
    });
    
    newSocket.on('reconnect_failed', () => {
      console.error('Failed to reconnect after all attempts');
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const socket = useContext(SocketContext);
  if (!socket) {
    console.warn('useSocket must be used within a SocketProvider');
  }
  return socket;
};

export default SocketContext;