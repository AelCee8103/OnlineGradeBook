import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Only create socket if it doesn't exist
    if (!socket) {
      const newSocket = io('http://localhost:3000', {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        autoConnect: true
      });

      newSocket.on('connect', () => {
        console.log('Socket connected successfully');
        setIsConnected(true);

        // Get user information from localStorage
        const facultyID = localStorage.getItem('facultyID');
        const facultyName = localStorage.getItem('facultyName');
        const adminID = localStorage.getItem('adminID');
        const adminName = localStorage.getItem('adminName');

        // Authenticate based on user type
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

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

      setSocket(newSocket);

      // Cleanup function
      return () => {
        if (newSocket) {
          newSocket.removeAllListeners();
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
  if (!socket) {
    console.warn('useSocket must be used within a SocketProvider');
  }
  return socket;
};

export default SocketContext;