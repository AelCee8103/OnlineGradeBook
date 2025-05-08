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
    if (!socket) return;

    console.log('Setting up socket listeners for userType:', userType);

    const handleValidationResponse = (data) => {
      const newNotification = {
        id: Date.now(),
        message: `Your grade validation request has been ${data.status}`,
        timestamp: new Date().toISOString(),
        type: 'validation_response',
        status: data.status,
        read: false
      };

      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(count => count + 1);
    };

    if (userType === 'faculty') {
      socket.on('validationResponseReceived', handleValidationResponse);
      console.log('Faculty socket listener set up');
    }

    return () => {
      if (userType === 'faculty') {
        socket.off('validationResponseReceived');
      }
    };
  }, [socket, userType]);

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(count => Math.max(0, count - 1));
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
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
          <div className="p-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-700">Notifications</h3>
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-3 border-b ${
                    notification.read ? 'opacity-75' : ''
                  } ${
                    notification.type === 'validation_response'
                      ? notification.status === 'approved'
                        ? 'bg-green-50'
                        : 'bg-red-50'
                      : 'bg-white'
                  } hover:bg-gray-50 cursor-pointer`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <p className="text-sm font-medium text-gray-800">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(new Date(notification.timestamp), 'MMM d, yyyy h:mm a')}
                  </p>
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