import { toast } from 'react-hot-toast';

/**
 * Save notifications to localStorage with userType prefix
 * @param {Array} notifications - Array of notification objects
 * @param {string} userType - 'faculty' or 'admin'
 */
export const saveNotifications = (notifications, userType) => {
  try {
    localStorage.setItem(`notifications_${userType}`, JSON.stringify(notifications));
  } catch (error) {
    console.error("Error saving notifications to localStorage:", error);
  }
};

/**
 * Get notifications from localStorage with userType prefix
 * @param {string} userType - 'faculty' or 'admin'
 * @returns {Array} Array of notification objects
 */
export const getStoredNotifications = (userType) => {
  try {
    const stored = localStorage.getItem(`notifications_${userType}`);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error retrieving notifications from localStorage:", error);
    return [];
  }
};

/**
 * Show a toast notification with a unique ID to prevent duplicates
 * @param {string} type - 'success', 'error', 'info'
 * @param {string} message - Notification message
 * @param {string} uniqueId - Unique ID to prevent duplicate toasts
 * @param {Object} options - Additional toast options
 */
export const showUniqueToast = (type, message, uniqueId, options = {}) => {
  // Default options
  const defaultOptions = { 
    id: uniqueId,
    duration: 4000,
    position: 'top-right'
  };
  
  // Merge default options with provided options
  const toastOptions = { ...defaultOptions, ...options };
  
  // Show toast based on type
  switch (type) {
    case 'success':
      toast.success(message, toastOptions);
      break;
    case 'error':
      toast.error(message, toastOptions);
      break;
    default:
      toast(message, toastOptions);
  }
};