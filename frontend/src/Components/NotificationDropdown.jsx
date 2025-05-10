import { useState, useEffect } from "react";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useSocket } from '../context/SocketContext';
import { format } from 'date-fns';

const NotificationDropdown = ({ userType }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const socket = useSocket();

  useEffect(() => {
    const handleValidationResponse = (data) => {
      const newNotification = {
        id: Date.now(),
        message: data.message || `Grade validation request has been ${data.status}`,
        timestamp: data.timestamp || new Date().toISOString(),
        type: 'validation_response',
        status: data.status,
        read: false
      };
      setNotifications((prev) => [...prev, newNotification]);
      setUnreadCount((prev) => prev + 1);
    };

    if (userType === 'faculty') {
      socket.on('validationResponseReceived', handleValidationResponse);
    }

    return () => {
      if (userType === 'faculty') {
        socket.off('validationResponseReceived', handleValidationResponse);
      }
    };
  }, [socket, userType]);

  useEffect(() => {
    const handleNewValidationRequest = (data) => {
      const newNotification = {
        id: Date.now(),
        message: `New validation request from ${data.facultyName} for Grade ${data.grade} - ${data.section}`,
        timestamp: new Date().toISOString(),
        type: 'new_request',
        facultyName: data.facultyName,
        read: false
      };
      setNotifications((prev) => [...prev, newNotification]);
      setUnreadCount((prev) => prev + 1);
    };

    if (userType === 'admin') {
      socket.on('newValidationRequest', handleNewValidationRequest);
    }

    return () => {
      if (userType === 'admin') {
        socket.off('newValidationRequest', handleNewValidationRequest);
      }
    };
  }, [socket, userType]);

  const markAsRead = (notificationId) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, read: true }))
    );
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
                      ? notification.status === 'approved'
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