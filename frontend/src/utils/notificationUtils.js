/**
 * Save notifications to localStorage with proper structure
 * @param {Array} notifications - List of notification objects
 * @param {number} maxStoredNotifications - Maximum number of notifications to store (default: 50)
 */
export const saveNotifications = (notifications, maxStoredNotifications = 50) => {
  // Limit the number of stored notifications to prevent localStorage overflow
  const limitedNotifications = notifications.slice(0, maxStoredNotifications);
  localStorage.setItem('notifications', JSON.stringify(limitedNotifications));
};

/**
 * Get stored notifications from localStorage
 * @returns {Array} Array of notification objects
 */
export const getStoredNotifications = () => {
  try {
    const stored = localStorage.getItem('notifications');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error parsing stored notifications:', error);
    return [];
  }
};

/**
 * Get notifications filtered by user type
 * @param {string} userType - 'admin' or 'faculty'
 * @returns {Array} Filtered notifications for the specified user type
 */
export const getUserTypeNotifications = (userType) => {
  const allNotifications = getStoredNotifications();
  
  if (userType === 'admin') {
    return allNotifications.filter(notification => notification.forAdmin === true);
  } else if (userType === 'faculty') {
    return allNotifications.filter(notification => notification.forFaculty === true);
  }
  
  return [];
};

/**
 * Clear all notifications for a specific user type
 * @param {string} userType - 'admin' or 'faculty' 
 */
export const clearUserTypeNotifications = (userType) => {
  const allNotifications = getStoredNotifications();
  
  // Keep only notifications for other user types
  const remainingNotifications = allNotifications.filter(notification => {
    if (userType === 'admin') {
      return !notification.forAdmin;
    } else if (userType === 'faculty') {
      return !notification.forFaculty;
    }
    return true;
  });
  
  saveNotifications(remainingNotifications);
};

/**
 * Get the count of unread notifications for a specific user type
 * @param {string} userType - 'admin' or 'faculty' 
 * @returns {number} Count of unread notifications
 */
export const getUnreadNotificationCount = (userType) => {
  try {
    const notifications = getUserTypeNotifications(userType);
    return notifications.filter(notification => !notification.read).length;
  } catch (error) {
    console.error('Error counting unread notifications:', error);
    return 0;
  }
};

/**
 * Mark all notifications as read for a specific user type
 * @param {string} userType - 'admin' or 'faculty'
 */
export const markAllNotificationsAsRead = (userType) => {
  const allNotifications = getStoredNotifications();
  
  // Update read status for the specified user type
  const updatedNotifications = allNotifications.map(notification => {
    if ((userType === 'admin' && notification.forAdmin) || 
        (userType === 'faculty' && notification.forFaculty)) {
      return { ...notification, read: true };
    }
    return notification;
  });
  
  saveNotifications(updatedNotifications);
};

/**
 * Add a new notification and persist it to localStorage
 * @param {Object} notification - The notification object to add
 * @param {string} userType - 'admin' or 'faculty'
 * @returns {Array} Updated array of notifications
 */
export const addNotification = (notification, userType) => {
  const allNotifications = getStoredNotifications();
  
  // Add the new notification to the front of the array
  const updatedNotifications = [notification, ...allNotifications];
  saveNotifications(updatedNotifications);
  
  // Return only notifications for the current user type
  return getUserTypeNotifications(userType);
};

/**
 * Create a confirmation notification for the admin after they approve/reject validation
 * @param {Object} data - The approval/rejection data
 * @returns {Object} A notification object
 */
export const createAdminConfirmationNotification = (data) => {
  const action = data.status === 'approved' ? 'approved' : 'rejected';
  
  return {
    id: Date.now(),
    message: `You have ${action} grade validation request from faculty ${data.facultyName || data.facultyID}. Notification has been sent.`,
    timestamp: new Date().toISOString(),
    type: 'action_confirmation',
    status: data.status,
    forAdmin: true,
    forFaculty: false,
    advisoryID: data.advisoryID,
    facultyID: data.facultyID,
    read: false
  };
};

/**
 * Check for validation response notifications on login
 * @param {string} userType - 'admin' or 'faculty'
 * @param {string} userID - The ID of the current user
 * @returns {boolean} True if there are unread validation responses
 */
export const hasUnreadValidationResponses = (userType, userID) => {
  const notifications = getUserTypeNotifications(userType);
  
  if (userType === 'faculty') {
    return notifications.some(n => 
      n.type === 'validation_response' && 
      !n.read && 
      n.facultyID === userID
    );
  }
  
  return false;
};