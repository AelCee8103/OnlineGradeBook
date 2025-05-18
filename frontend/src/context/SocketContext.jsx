import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    console.log('Initializing socket connection');

    // Create socket instance with better configuration
    const socketInstance = io('http://localhost:3000', {
      autoConnect: false, // Don't connect automatically
      reconnectionAttempts: 5, // Limit reconnection attempts
      reconnectionDelay: 1000, // Start with 1s delay
      reconnectionDelayMax: 5000, // Max 5s delay
      timeout: 10000, // Connection timeout
      transports: ['websocket', 'polling'] // Try WebSocket first, then polling
    });

    // Add comprehensive logging
    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    socketInstance.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Socket reconnection attempt ${attemptNumber}`);
    });

    socketInstance.on('reconnect_failed', () => {
      console.log('Socket reconnection failed');
    });

    socketInstance.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Connect the socket
    socketInstance.connect();

    // Update our state
    setSocket(socketInstance);
    setIsInitialized(true);

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up socket connection');
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance.off('connect');
        socketInstance.off('connect_error');
        socketInstance.off('disconnect');
        socketInstance.off('reconnect_attempt');
        socketInstance.off('reconnect_failed');
        socketInstance.off('error');
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};