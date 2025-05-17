import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
  const socket = useContext(SocketContext);
  if (socket === undefined) {
    console.warn('useSocket must be used within a SocketProvider');
  }
  return socket;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  useEffect(() => {
    // Create socket connection
    console.log('Initializing socket connection');
    const connectSocket = () => {
      try {
        if (socketRef.current) {
          console.log('Cleaning up existing socket before reconnecting');
          socketRef.current.disconnect();
        }

        const newSocket = io('http://localhost:3000', {
          withCredentials: true,
          transports: ['websocket', 'polling'],
          timeout: 10000,
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5
        });

        socketRef.current = newSocket;

        newSocket.on('connect', () => {
          console.log('Socket connected:', newSocket.id);
          setSocket(newSocket);
          // Clear any reconnect timers when successfully connected
          if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
          }
        });

        newSocket.on('connect_error', (error) => {
          console.error('Socket connection error:', error.message);
          // Only attempt to reconnect if we don't already have a timer
          if (!reconnectTimerRef.current) {
            reconnectTimerRef.current = setTimeout(() => {
              console.log('Attempting to reconnect...');
              reconnectTimerRef.current = null;
              connectSocket();
            }, 5000); // Try to reconnect after 5 seconds
          }
        });

        return newSocket;
      } catch (error) {
        console.error('Failed to initialize socket:', error);
        return null;
      }
    };

    const newSocket = connectSocket();
    
    // Cleanup function
    return () => {
      console.log('Cleaning up socket connection');
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};