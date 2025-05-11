export const saveNotifications = (notifications, userType) => {
  localStorage.setItem(`notifications_${userType}`, JSON.stringify(notifications));
};

export const getStoredNotifications = (userType) => {
  const stored = localStorage.getItem(`notifications_${userType}`);
  return stored ? JSON.parse(stored) : [];
};

// Remove duplicate status update notifications for the same request ID
export const removeDuplicateStatusNotifications = (notifications) => {
  const processedRequestIds = new Set();
  const result = [];
  
  // Sort by timestamp (newest first)
  const sorted = [...notifications].sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  );
  
  // Keep only the latest status update for each request
  sorted.forEach(notification => {
    if (notification.type !== 'status_update' || 
        !notification.requestID || 
        !processedRequestIds.has(notification.requestID)) {
      
      result.push(notification);
      
      if (notification.type === 'status_update' && notification.requestID) {
        processedRequestIds.add(notification.requestID);
      }
    }
  });
  
  return result;
};

// Remove duplicate faculty validation response notifications for the same request ID
export const removeDuplicateFacultyNotifications = (notifications) => {
  const processedRequestIds = new Set();
  const result = [];
  
  // Sort by timestamp (newest first)
  const sorted = [...notifications].sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  );
  
  // Keep only the latest notification for each request
  sorted.forEach(notification => {
    if (notification.type !== 'validation_response' || 
        !notification.requestID || 
        !processedRequestIds.has(notification.requestID)) {
      
      result.push(notification);
      
      if (notification.type === 'validation_response' && notification.requestID) {
        processedRequestIds.add(notification.requestID);
      }
    }
  });
  
  return result;
};

// Add a debugging utility to help diagnose notification issues
export const debugNotifications = () => {
  const adminNotifications = localStorage.getItem('notifications_admin');
  const facultyNotifications = localStorage.getItem('notifications_faculty');
  const oldNotifications = localStorage.getItem('notifications');
  
  return {
    adminCount: adminNotifications ? JSON.parse(adminNotifications).length : 0,
    facultyCount: facultyNotifications ? JSON.parse(facultyNotifications).length : 0,
    adminNotifications: adminNotifications ? JSON.parse(adminNotifications) : [],
    facultyNotifications: facultyNotifications ? JSON.parse(facultyNotifications) : [],
    oldNotifications: oldNotifications ? JSON.parse(oldNotifications) : [],
    hasOldFormat: !!oldNotifications
  };
};

// Utility to clear all notifications (useful for debugging)
export const clearAllNotifications = () => {
  localStorage.removeItem('notifications');
  localStorage.removeItem('notifications_admin');
  localStorage.removeItem('notifications_faculty');
};