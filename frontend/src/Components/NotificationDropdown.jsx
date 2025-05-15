import { useState, useEffect } from "react";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useSocket } from '../context/SocketContext';
import { format } from 'date-fns';

// Helper function to save notifications to localStorage
const saveNotifications = (notifications) => {
  localStorage.setItem('notifications', JSON.stringify(notifications));
};

// Helper function to retrieve notifications from localStorage
const getStoredNotifications = () => {
  const stored = localStorage.getItem('notifications');
  return stored ? JSON.parse(stored) : [];
};

const NotificationDropdown = ({ userType }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(() => getStoredNotifications());
  const [unreadCount, setUnreadCount] = useState(0);
  const socket = useSocket();

  // Calculate initial unread count
  useEffect(() => {
    const unreadNotifications = notifications.filter(n => !n.read).length;
    setUnreadCount(unreadNotifications);
  }, []);

  useEffect(() => {
    if (!socket) {
      console.log('No socket connection');
      return;
    }

    // Handler for new validation requests (Admin side)
    const handleNewRequest = (data) => {
      console.log('New validation request received:', data);
      const newNotification = {
        id: `req-${Date.now()}`,
        title: 'New Validation Request',
        message: `Faculty ${data.facultyName} requested grade validation for Grade ${data.grade} - ${data.section}`,
        timestamp: data.timestamp || new Date().toISOString(),
        type: 'validation_request',
        status: 'pending',
        facultyID: data.facultyID,
        read: false
      };

      setNotifications(prev => {
        const updated = [newNotification, ...prev];
        saveNotifications(updated);
        return updated;
      });
      setUnreadCount(prev => prev + 1);
    };

    // Handler for validation responses (Faculty side)
    const handleValidationResponse = (data) => {
      console.log('Validation response received:', data);
      const newNotification = {
        id: `resp-${Date.now()}`,
        title: data.status === 'approve' ? 'Validation Approved!' : 'Validation Rejected',
        message: data.message,
        timestamp: data.timestamp || new Date().toISOString(),
        type: 'validation_response',
        status: data.status, // 'approve' or 'reject'
        read: false,
        details: `Class: Grade ${data.Grade} - ${data.Section}`
      };

      setNotifications(prev => {
        const updated = [newNotification, ...prev];
        saveNotifications(updated);
        return updated;
      });
      setUnreadCount(prev => prev + 1);
    };

    console.log('Setting up socket listeners for userType:', userType);

    // Set up event listeners based on user type
    if (userType === 'admin') {
      socket.on('newValidationRequest', handleNewRequest);
      console.log('Admin socket listener set up for newValidationRequest');
    } else if (userType === 'faculty') {
      socket.on('validationResponseReceived', handleValidationResponse);
      console.log('Faculty socket listener set up for validationResponseReceived');
    }

    // Cleanup
    return () => {
      if (userType === 'admin') {
        socket.off('newValidationRequest', handleNewRequest);
      } else if (userType === 'faculty') {
        socket.off('validationResponseReceived', handleValidationResponse);
      }
    };
  }, [socket, userType]);

  const markAsRead = (notificationId) => {
    setNotifications(prev => {
      const updated = prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      );
      saveNotifications(updated);
      return updated;
    });
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    saveNotifications([]);
    setUnreadCount(0);
  };

  // Format relative time for notifications
  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    
    try {
      const now = new Date();
      const date = new Date(timestamp);
      const diffSeconds = Math.floor((now - date) / 1000);
      
      if (diffSeconds < 60) return 'just now';
      if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
      if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
      if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)}d ago`;
      
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown date';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
        aria-label="Notifications"
      >
        <FontAwesomeIcon icon={faBell} className="h-6 w-6" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
            {unreadCount}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50">
          <div className="px-4 py-2 bg-gray-800 text-white flex justify-between items-center rounded-t-md">
            <span className="font-bold">Notifications</span>
            <div className="space-x-2">
              {notifications.length > 0 && (
                <button 
                  onClick={clearAllNotifications} 
                  className="text-xs hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-4 px-4 text-gray-500 text-center">
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => {
                // Determine notification style based on status
                let bgColor = "bg-white hover:bg-gray-50";
                let iconBgColor = "bg-blue-100 text-blue-500";
                let icon = (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                );

                if (notification.status === 'approve') {
                  bgColor = notification.read ? "bg-green-50" : "bg-green-100";
                  iconBgColor = "bg-green-100 text-green-600";
                  icon = (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  );
                } else if (notification.status === 'reject') {
                  bgColor = notification.read ? "bg-red-50" : "bg-red-100";
                  iconBgColor = "bg-red-100 text-red-600";
                  icon = (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  );
                } else if (notification.type === 'validation_request') {
                  bgColor = notification.read ? "bg-blue-50" : "bg-blue-100";
                  iconBgColor = "bg-blue-100 text-blue-600";
                  icon = (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  );
                }

                return (
                  <div
                    key={notification.id}
                    className={`${bgColor} border-b border-gray-200 py-3 px-4 cursor-pointer`}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div className="flex items-start">
                      <div className={`rounded-full p-2 mr-3 ${iconBgColor}`}>
                        {icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatRelativeTime(notification.timestamp)}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        {notification.details && (
                          <p className="text-xs text-gray-500 mt-1">
                            {notification.details}
                          </p>
                        )}
                        {!notification.read && (
                          <span className="inline-block bg-blue-500 h-2 w-2 rounded-full mt-1"></span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;