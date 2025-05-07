import { useState, useEffect } from "react";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useSocket } from '../context/SocketContext';
import { format } from 'date-fns';
import { saveNotifications, getStoredNotifications } from '../utils/notificationUtils';

const NotificationDropdown = ({ userType }) => {
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
        id: Date.now(),
        message: `Faculty ${data.facultyName} requested grade validation for Grade ${data.grade} - ${data.section}`,
        timestamp: new Date().toISOString(),
        type: 'validation_request',
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
        id: Date.now(),
        message: `Your grade validation request has been ${data.status}`,
        timestamp: new Date().toISOString(),
        type: 'validation_response',
        status: data.status,
        read: false
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
      console.log('Admin socket listener set up');
    } else if (userType === 'faculty') {
      socket.on('validationResponseReceived', handleValidationResponse);
      console.log('Faculty socket listener set up');
    }

    // Cleanup
    return () => {
      if (userType === 'admin') {
        socket.off('newValidationRequest');
      } else if (userType === 'faculty') {
        socket.off('validationResponseReceived');
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
            {notifications.length > 0 && (
              <button 
                onClick={clearAllNotifications}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="divider my-1"></div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`${
                    notification.read ? 'opacity-75' : ''
                  } flex items-start gap-3 p-3 rounded-lg ${
                    notification.type === 'validation_response'
                      ? notification.status === 'approved'
                        ? 'bg-green-50 border-l-4 border-green-500'
                        : 'bg-red-50 border-l-4 border-red-500'
                      : 'bg-gray-50'
                  } cursor-pointer hover:bg-gray-100`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="flex flex-col flex-1">
                    <p className="font-medium text-gray-800">{notification.message}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(notification.timestamp), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">No notifications</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationDropdown;