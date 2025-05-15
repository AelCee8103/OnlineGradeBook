import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Effect to handle socket initialization
  useEffect(() => {
    console.log('Initializing socket connection...');
    
    const socketInstance = io('http://localhost:3000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      withCredentials: true,
      autoConnect: true,
      forceNew: true
    });

    // Socket event handlers
    socketInstance.on('connect', () => {
      console.log('Socket connected successfully');
      setIsConnected(true);
      
      // Get user credentials
      const facultyID = localStorage.getItem('facultyID');
      const facultyName = localStorage.getItem('facultyName');
      const adminID = localStorage.getItem('adminID');
      const adminName = localStorage.getItem('adminName');

      // Authenticate after connection
      if (facultyID && facultyName) {
        socketInstance.emit('authenticate', {
          userType: 'faculty',
          userID: facultyID,
          facultyName
        });
      } else if (adminID && adminName) {
        socketInstance.emit('authenticate', {
          userType: 'admin',
          userID: adminID,
          adminName
        });
      }
    });

    socketInstance.on('authenticated', (response) => {
      if (response.success) {
        console.log('Socket authenticated successfully');
      } else {
        console.error('Socket authentication failed:', response.error);
        toast.error('Failed to authenticate connection');
      }
    });

    socketInstance.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${reason}`);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
      toast.error('Connection error. Please check your internet connection.');
    });

    // Handle reconnection events
    socketInstance.on('reconnect', (attemptNumber) => {
      console.log(`Reconnected after ${attemptNumber} attempts`);
      // Re-authenticate on reconnection
      const facultyID = localStorage.getItem('facultyID');
      const facultyName = localStorage.getItem('facultyName');
      const adminID = localStorage.getItem('adminID');
      const adminName = localStorage.getItem('adminName');

      if (facultyID && facultyName) {
        socketInstance.emit('authenticate', {
          userType: 'faculty',
          userID: facultyID,
          facultyName
        });
      } else if (adminID && adminName) {
        socketInstance.emit('authenticate', {
          userType: 'admin',
          userID: adminID,
          adminName
        });
      }
    });

    // Set socket instance in state
    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up socket connection');
      if (socketInstance) {
        socketInstance.off('connect');
        socketInstance.off('authenticated');
        socketInstance.off('disconnect');
        socketInstance.off('connect_error');
        socketInstance.off('reconnect');
        if (socketInstance.connected) {
          socketInstance.disconnect();
        }
        socketInstance.close();
      }
    };
  }, []); // Empty dependency array means this runs once on mount

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const socket = useContext(SocketContext);
  if (!socket && process.env.NODE_ENV !== 'production') {
    console.warn('useSocket must be used within a SocketProvider');
  }
  return socket;
};

export default SocketContext;