import { useState, useEffect } from "react";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useSocket } from '../context/SocketContext';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { saveNotifications, getStoredNotifications, showUniqueToast } from '../utils/notificationUtils';

const NotificationDropdown = ({ userType }) => {
  const [notifications, setNotifications] = useState(() => getStoredNotifications(userType));
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(() => {
    return getStoredNotifications(userType).filter(notif => !notif.read).length;
  });
  const socket = useSocket();

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    saveNotifications(notifications, userType);
  }, [notifications, userType]);
  
  // Handle faculty validation responses
  useEffect(() => {
    if (!socket) return;

    const handleValidationResponse = (data) => {
      console.log("Faculty received validation response:", data);
      
      const message = data.message || `Your grade validation request has been ${data.status}d`;
      const isApproved = data.status === 'approve' || data.status === 'approved';
      
      const newNotification = {
        id: Date.now(),
        message: message,
        timestamp: data.timestamp || new Date().toISOString(),
        type: 'validation_response',
        status: data.status,
        read: false,
        advisoryID: data.advisoryID
      };
      
      setNotifications(prev => {
        // Add at the beginning (most recent first)
        const updated = [newNotification, ...prev];
        return updated;
      });
      
      setUnreadCount(prev => prev + 1);
      
      // Show a single toast notification for important events using our utility
      showUniqueToast(
        isApproved ? 'success' : 'error', 
        message, 
        `validation-${data.requestID}`,
        { position: 'top-right' }
      );
    };

    if (userType === 'faculty') {
      console.log("Setting up validationResponseReceived listener for faculty");
      socket.on('validationResponseReceived', handleValidationResponse);
    }

    return () => {
      if (userType === 'faculty') {
        console.log("Cleaning up validationResponseReceived listener");
        socket.off('validationResponseReceived', handleValidationResponse);
      }
    };
  }, [socket, userType]);

  // Handle admin notifications for new validation requests
  useEffect(() => {
    if (!socket) return;
    
    const handleNewValidationRequest = (data) => {
      console.log("Admin received new validation request:", data);
      
      const message = `New validation request from ${data.facultyName} for Grade ${data.grade} - ${data.section}`;
      
      const newNotification = {
        id: Date.now(),
        message: message,
        timestamp: new Date().toISOString(),
        type: 'new_request',
        facultyName: data.facultyName,
        read: false,
        requestID: data.requestID
      };
      
      setNotifications(prev => {
        // Add at the beginning (most recent first)
        const updated = [newNotification, ...prev];
        return updated;
      });
      
      setUnreadCount(prev => prev + 1);
      
      // Use our utility function for showing a unique toast notification
      showUniqueToast(
        'info', 
        message, 
        `admin-new-request-${data.requestID}`, 
        { position: 'top-center' }
      );
    };

    if (userType === 'admin') {
      console.log("Setting up newValidationRequest listener for admin");
      socket.on('newValidationRequest', handleNewValidationRequest);
    }

    return () => {
      if (userType === 'admin') {
        console.log("Cleaning up newValidationRequest listener");
        socket.off('newValidationRequest', handleNewValidationRequest);
      }
    };
  }, [socket, userType]);

  const markAsRead = (notificationId) => {
    setNotifications(prev => {
      const updated = prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      );
      return updated;
    });
    
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(notif => ({ ...notif, read: true }));
      return updated;
    });
    
    setUnreadCount(0);
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800"
      >
        <FontAwesomeIcon icon={faBell} className="text-xl" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
          <div className="p-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-700">Notifications</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Mark all as read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                  className={`p-4 border-b ${
                    notification.read ? 'bg-gray-50' : 'bg-white'
                  } ${
                    notification.type === 'validation_response'
                      ? notification.status === 'approve' || notification.status === 'approved'
                        ? 'hover:bg-green-50'
                        : 'hover:bg-red-50'
                      : 'hover:bg-blue-50'
                  } cursor-pointer transition-colors duration-150`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 mt-2 rounded-full ${
                      !notification.read ? 'bg-blue-500' : 'bg-gray-300'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(notification.timestamp), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;