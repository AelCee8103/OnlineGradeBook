import { useState, useEffect, useRef } from "react";
import { faBell, faCheckCircle, faTimesCircle, faTrash, faEllipsisV } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useSocket } from '../context/SocketContext';
import { format } from 'date-fns';
import { saveNotifications, getStoredNotifications, removeDuplicateStatusNotifications, removeDuplicateFacultyNotifications } from '../utils/notificationUtils';

const NotificationDropdown = ({ userType }) => {
  // Initialize with stored notifications that match the current userType or have no userType defined
  const [notifications, setNotifications] = useState(() => {
    const storedNotifications = getStoredNotifications(userType);
    // Filter to ensure we only display notifications for this user type
    return storedNotifications.filter(n => !n.userType || n.userType === userType);
  });
  
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(() => 
    notifications.filter(n => !n.read).length
  );
  const socket = useSocket();
  const dropdownRef = useRef(null);
  // Clean up any duplicate status update notifications on component mount
  useEffect(() => {
    if (userType === 'admin') {
      // Find unique request IDs
      const requestIds = notifications
        .filter(n => n.type === 'status_update' && n.requestID)
        .map(n => n.requestID);
      
      const uniqueRequestIds = [...new Set(requestIds)];
      
      if (requestIds.length > uniqueRequestIds.length) {
        // We have duplicates, clean them up
        const cleanedNotifications = removeDuplicateStatusNotifications(notifications);
        
        // Update with cleaned notifications
        setNotifications(cleanedNotifications);
      }
    }
  }, [userType, notifications]);
  
  // Migrate old notifications if they exist
  useEffect(() => {
    // Check if there are old notifications without user types
    const oldNotifications = localStorage.getItem('notifications');
    if (oldNotifications) {
      try {
        const parsedNotifications = JSON.parse(oldNotifications);
        if (Array.isArray(parsedNotifications) && parsedNotifications.length > 0) {
          // Attempt to sort notifications by user type
          const adminNotifications = [];
          const facultyNotifications = [];
          
          parsedNotifications.forEach(notification => {
            // Try to determine user type from the notification content
            if (notification.type === 'validation_response' || 
                (notification.message && notification.message.includes('Your grade validation'))) {
              // Faculty notification
              facultyNotifications.push({...notification, userType: 'faculty'});
            } else if (notification.type === 'new_request' || notification.type === 'status_update' ||
                      (notification.message && 
                       (notification.message.includes('Faculty') || 
                        notification.message.includes('Validation request')))) {
              // Admin notification
              adminNotifications.push({...notification, userType: 'admin'});
            }
          });
          
          // Store the migrated notifications
          if (adminNotifications.length > 0) {
            saveNotifications(adminNotifications, 'admin');
          }
          if (facultyNotifications.length > 0) {
            saveNotifications(facultyNotifications, 'faculty');
          }
          
          // Update current component state if appropriate
          if (userType === 'admin' && adminNotifications.length > 0) {
            setNotifications(prev => [...adminNotifications, ...prev]);
          } else if (userType === 'faculty' && facultyNotifications.length > 0) {
            setNotifications(prev => [...facultyNotifications, ...prev]);
          }
          
          // Delete old notifications
          localStorage.removeItem('notifications');
        }
      } catch (error) {
        console.error('Error migrating notifications:', error);
        localStorage.removeItem('notifications');
      }
    }
  }, [userType]);

  // Clean up any old notifications without userType on component mount
  useEffect(() => {
    // Clear out the old notifications storage that didn't differentiate by user type
    localStorage.removeItem('notifications');
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);  // Persist notifications to localStorage whenever they change
  useEffect(() => {
    // Clean up any duplicate notifications before saving
    if (userType === 'admin') {
      const cleanedNotifications = removeDuplicateStatusNotifications(notifications);
      saveNotifications(cleanedNotifications, userType);
      setUnreadCount(cleanedNotifications.filter(n => !n.read).length);
    } else if (userType === 'faculty') {
      const cleanedNotifications = removeDuplicateFacultyNotifications(notifications);
      saveNotifications(cleanedNotifications, userType);
      setUnreadCount(cleanedNotifications.filter(n => !n.read).length);
    } else {
      saveNotifications(notifications, userType);
      setUnreadCount(notifications.filter(n => !n.read).length);
    }
  }, [notifications, userType]);

  // Faculty: Listen for validationResponseReceived
  useEffect(() => {
    if (!socket || userType !== 'faculty') return;
      const handleValidationResponse = (data) => {
      // Check if we already have a notification for this request
      const existingNotificationIndex = notifications.findIndex(
        n => n.requestID === data.requestID && n.type === 'validation_response'
      );
      
      let message = '';
      if (data.status === 'approved') {
        message = 'Your grade validation request has been approved. Please visit the office to finalize your validation status.';
      } else if (data.status === 'rejected') {
        message = 'Your grade validation request has been rejected. Please visit the office to discuss your validation status.';
      } else {
        message = `Grade validation request has been ${data.status}`;
      }
      
      if (existingNotificationIndex !== -1) {
        // Update existing notification instead of adding a new one
        setNotifications(prev => {
          const updated = [...prev];
          updated[existingNotificationIndex] = {
            ...updated[existingNotificationIndex],
            message: message,
            timestamp: data.timestamp || new Date().toISOString(),
            status: data.status,
            read: false
          };
          return updated;
        });
      } else {
        // Add new notification
        const newNotification = {
          id: Date.now(),
          message: message,
          timestamp: data.timestamp || new Date().toISOString(),
          type: 'validation_response',
          status: data.status,
          requestID: data.requestID,
          userType: 'faculty',
          read: false
        };
        setNotifications(prev => [newNotification, ...prev]);
      }
    };
    
    socket.on('validationResponseReceived', handleValidationResponse);
    return () => {
      socket.off('validationResponseReceived', handleValidationResponse);
    };
  }, [socket, userType]);
  // Admin: Listen for newValidationRequest ONLY (not validation status updates)
  useEffect(() => {
    if (!socket || userType !== 'admin') return;
    
    const handleNewValidationRequest = (data) => {      
      const newNotification = {
        id: Date.now(),
        message: `Faculty ${data.facultyName} has requested grade validation for Grade ${data.grade} - ${data.section}`,
        timestamp: new Date().toISOString(),
        type: 'new_request',
        facultyName: data.facultyName,
        requestDetails: data,
        userType: 'admin',
        read: false
      };
      setNotifications(prev => [newNotification, ...prev]);
    };
    
    // No longer listen for 'validationStatusUpdate' - admins should not get notifications 
    // for their own approvals/rejections
    
    socket.on('newValidationRequest', handleNewValidationRequest);
    
    return () => {
      socket.off('newValidationRequest', handleNewValidationRequest);
    };
  }, [socket, userType]);
  const markAsRead = (notificationId) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true, userType } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, read: true, userType }))
    );
  };

  const clearAll = () => {
    setNotifications([]);
    // Clear the specific user type's notifications
    localStorage.removeItem(`notifications_${userType}`);
  };
  
  const handleActionClick = (notification) => {
    if (userType === 'admin' && notification.type === 'new_request' && notification.requestDetails) {
      // Navigate to validation requests page or open detailed modal
      // This could trigger a route change via React Router or dispatch an action
      if (socket) {
        socket.emit('adminViewedRequest', { requestID: notification.requestDetails.requestID });
      }
      markAsRead(notification.id);
    }
  };

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800"
        aria-label="Notifications"
      >
        <FontAwesomeIcon icon={faBell} className="text-xl" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
            <div className="p-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-gray-700">Notifications</h3>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs md:text-sm text-blue-600 hover:text-blue-800"
                  >
                    Mark all as read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-xs md:text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>            <div className="max-h-96 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications
                  .filter(notification => notification.userType === undefined || notification.userType === userType)
                  .map(notification => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b ${
                      notification.read ? 'bg-gray-50' : 'bg-white'
                    } hover:bg-gray-100 transition-colors duration-150`}
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                          !notification.read ? 'bg-blue-500' : 'bg-gray-300'
                        } ${
                          notification.status === 'approved' ? 'bg-green-500' : 
                          notification.status === 'rejected' ? 'bg-red-500' : ''
                        }`}
                      ></div>
                      <div className="flex-1">
                        <div 
                          className="text-sm text-gray-800"
                          onClick={() => markAsRead(notification.id)}
                        >
                          {notification.message}
                        </div>
                        <div className="mt-1 flex justify-between items-center">
                          <span className="text-xs text-gray-500">
                            {format(new Date(notification.timestamp), 'MMM d, yyyy h:mm a')}
                          </span>
                          {userType === 'admin' && notification.type === 'new_request' && !notification.read && (
                            <button 
                              onClick={() => handleActionClick(notification)}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              View Details
                            </button>
                          )}
                        </div>
                      </div>                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-gray-400 hover:text-gray-600"
                        title={notification.read ? "Already read" : "Mark as read"}
                      >
                        {notification.status === 'approved' ? (
                          <FontAwesomeIcon icon={faCheckCircle} className="text-sm text-green-500" />
                        ) : notification.status === 'rejected' ? (
                          <FontAwesomeIcon icon={faTimesCircle} className="text-sm text-red-500" />
                        ) : (
                          <FontAwesomeIcon icon={notification.read ? faCheckCircle : faTimesCircle} className="text-sm text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 px-4 text-center text-gray-500">
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