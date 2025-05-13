import { useState, useEffect } from "react";
import { faBell, faCheck, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useSocket } from '../context/SocketContext';
import { format } from 'date-fns';
import { 
  saveNotifications, 
  getStoredNotifications, 
  getUserTypeNotifications,
  clearUserTypeNotifications,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  addNotification,
  createAdminConfirmationNotification
} from '../utils/notificationUtils';
import { getCurrentUserType, getCurrentUserId } from '../utils/userUtils';

const NotificationDropdown = ({ userType: providedUserType }) => {
  // If userType is not provided, determine it from localStorage
  const userType = providedUserType || getCurrentUserType();
  
  const [notifications, setNotifications] = useState(() => {
    // Get only the notifications for this user type using the utility function
    return getUserTypeNotifications(userType);
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const socket = useSocket();
  
  // Filter notifications based on user type
  const filterNotificationsByUserType = (notifications, type) => {
    if (!notifications || !type) return [];
    
    return notifications.filter(notification => {
      // Admin notifications
      if (type === 'admin') {
        return notification.forAdmin === true;
      }
      // Faculty notifications
      else if (type === 'faculty') {
        return notification.forFaculty === true;
      }
      return false;
    });
  };

  // Calculate initial unread count
  useEffect(() => {
    const unreadNotifications = notifications.filter(n => !n.read).length;
    setUnreadCount(unreadNotifications);
  }, [notifications]);

  useEffect(() => {
    if (!socket) {
      console.log('No socket connection');
      return;
    }

    // Get user-specific IDs from localStorage
    const facultyID = localStorage.getItem('facultyID');
    const adminID = localStorage.getItem('adminID');

    // Handler for new validation requests (Admin side)
    const handleNewRequest = (data) => {
      console.log('New validation request received:', data);
      
      // Only process if user is an admin
      if (userType !== 'admin') return;
      
      const newNotification = {
        id: Date.now(),
        message: `Faculty ${data.facultyName} requested grade validation for Grade ${data.grade} - ${data.section}`,
        timestamp: new Date().toISOString(),
        type: 'validation_request',
        facultyID: data.facultyID,
        advisoryID: data.advisoryID,
        forAdmin: true,
        forFaculty: false,
        read: false
      };

      // Add to local state and persist to localStorage
      const updatedNotifications = addNotification(newNotification, userType);
      setNotifications(updatedNotifications);
      setUnreadCount(prev => prev + 1);
    };

    const handleValidationResponse = (data) => {
      console.log('Validation response received:', data);
      
      // Create a notification object for faculty
      const notification = {
        id: `validation-${data.requestID || Date.now()}`,
        type: 'validation',
        message: data.message || `Your grade validation request has been ${data.status}`,
        status: data.status,
        timestamp: new Date().toISOString(),
        forFaculty: true,
        read: false,
      };
      setNotifications(prev => {
        const updated = addNotification(notification, 'faculty');
        return updated;
      });
      setUnreadCount(prev => prev + 1);
    };

    const handleFacultyNotification = (data) => {
      console.log('Faculty notification received:', data);
      
      // Create a notification object for faculty
      const notification = {
        id: `faculty-${data.requestID || Date.now()}`,
        type: 'faculty',
        message: data.message || `Your grade validation request has been ${data.status}`,
        status: data.status,
        timestamp: new Date().toISOString(),
        forFaculty: true,
        read: false,
      };
      setNotifications(prev => {
        const updated = addNotification(notification, 'faculty');
        return updated;
      });
      setUnreadCount(prev => prev + 1);
    };
    
    // Handler for processing validation requests (Admin side)
    const handleValidationProcessed = (data) => {
      if (userType !== 'admin') return;
      
      // For the admin who processed the request, create a confirmation notification
      if (adminID === data.adminID) {
        const confirmationNotification = createAdminConfirmationNotification(data);
        const updatedNotifications = addNotification(confirmationNotification, userType);
        setNotifications(updatedNotifications);
        setUnreadCount(prev => prev + 1);
      }
      // For other admins, notify them that another admin processed the request
      else {
        const newNotification = {
          id: Date.now(),
          message: `Admin ${data.adminName || 'Another admin'} ${data.status}ed validation request from ${data.facultyName || 'faculty'}`,
          timestamp: new Date().toISOString(),
          type: 'request_processed',
          status: data.status,
          forAdmin: true,
          forFaculty: false,
          advisoryID: data.advisoryID,
          read: false
        };
        
        const updatedNotifications = addNotification(newNotification, userType);
        setNotifications(updatedNotifications);
        setUnreadCount(prev => prev + 1);
      }
    };

    console.log('Setting up socket listeners for userType:', userType);

    // Set up event listeners based on user type
    if (userType === 'admin') {
      socket.on('newValidationRequest', handleNewRequest);
      socket.on('validationStatusUpdate', handleValidationProcessed);
      socket.on('requestProcessed', handleValidationProcessed);
      console.log('Admin socket listeners set up');
    } else if (userType === 'faculty') {
      socket.on('validationResponseReceived', handleValidationResponse);
      socket.on('validationStatusUpdate', handleFacultyNotification);
      socket.on('facultyNotification', handleFacultyNotification);
      console.log('Faculty socket listener set up');
    }

    // Cleanup
    return () => {
      if (userType === 'admin') {
        socket.off('newValidationRequest');
        socket.off('validationStatusUpdate');
        socket.off('requestProcessed');
      } else if (userType === 'faculty') {
        socket.off('validationResponseReceived', handleValidationResponse);
        socket.off('validationStatusUpdate', handleFacultyNotification);
        socket.off('facultyNotification', handleFacultyNotification);
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
      
      // Update local storage with read status
      const allStoredNotifications = getStoredNotifications();
      const otherTypeNotifications = allStoredNotifications.filter(notification => {
        if (userType === 'admin') {
          return !notification.forAdmin;
        } else if (userType === 'faculty') {
          return !notification.forFaculty;
        }
        return true;
      });
      
      saveNotifications([...updated, ...otherTypeNotifications]);
      return updated;
    });
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const clearAllNotifications = () => {
    // Only clear notifications for the current user type
    setNotifications([]);
    
    // Get all notifications and filter out current type
    const allStoredNotifications = getStoredNotifications();
    const remainingNotifications = allStoredNotifications.filter(notification => {
      if (userType === 'admin') {
        return !notification.forAdmin;
      } else if (userType === 'faculty') {
        return !notification.forFaculty;
      }
      return true;
    });
    
    saveNotifications(remainingNotifications);
    setUnreadCount(0);
  };

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
        <div className="indicator">
          <FontAwesomeIcon icon={faBell} className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="badge badge-sm badge-error indicator-item">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
      <div
        tabIndex={0}
        className="dropdown-content z-[1] mt-3 card card-compact w-96 bg-base-100 shadow-lg border border-gray-100"
      >
        <div className="card-body">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-lg">Notifications</span>
            <div className="flex gap-3">
              {unreadCount > 0 && (
                <button 
                  onClick={() => {
                    markAllNotificationsAsRead(userType);
                    setNotifications(prev => prev.map(n => ({...n, read: true})));
                    setUnreadCount(0);
                  }}
                  className="text-xs text-gray-600 hover:text-gray-800 px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button 
                  onClick={clearAllNotifications}
                  className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded-full bg-red-50 hover:bg-red-100"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
          <div className="divider my-1"></div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`${
                    notification.read ? 'opacity-75' : 'shadow-sm'
                  } flex items-start gap-3 p-3 rounded-lg ${
                    // Use status-specific colors
                    notification.type === 'validation_response'
                      ? notification.status === 'approved'
                        ? 'bg-green-50 border-l-4 border-green-500'
                        : 'bg-red-50 border-l-4 border-red-500'
                      : notification.type === 'validation_request'
                        ? 'bg-yellow-50 border-l-4 border-yellow-500'
                        : notification.type === 'action_confirmation'
                        ? 'bg-blue-50 border-l-4 border-blue-500'
                        : 'bg-blue-50 border-l-4 border-blue-500'
                  } transition-all`}
                >
                  <div className="flex flex-col flex-1">
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-gray-800">{notification.message}</p>
                      {!notification.read && (
                        <button 
                          onClick={() => markAsRead(notification.id)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                          title="Mark as read"
                        >
                          <FontAwesomeIcon icon={faCheck} className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-sm text-gray-500">
                        {format(new Date(notification.timestamp), 'MMM d, yyyy h:mm a')}
                      </p>
                      {/* Add role indicator for clarity */}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        notification.forAdmin ? 'bg-purple-100 text-purple-800' : 'bg-teal-100 text-teal-800'
                      }`}>
                        {notification.forAdmin ? 'Admin' : 'Faculty'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-gray-500">
                <FontAwesomeIcon icon={faBell} className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                <p>No notifications</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationDropdown;