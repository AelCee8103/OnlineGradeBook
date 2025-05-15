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
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      
      // Authenticate based on user type
      const facultyID = localStorage.getItem('facultyID');
      const adminID = localStorage.getItem('adminID');
      const facultyName = localStorage.getItem('facultyName');
      const adminName = localStorage.getItem('adminName');

      if (facultyID) {
        console.log('Authenticating as faculty:', facultyID);
        newSocket.emit('authenticate', {
          userType: 'faculty',
          userID: facultyID,
          facultyName
        });
      } else if (adminID) {
        console.log('Authenticating as admin:', adminID);
        newSocket.emit('authenticate', {
          userType: 'admin',
          userID: adminID,
          adminName
        });
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
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