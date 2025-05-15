import axios from 'axios';
import toast from 'react-hot-toast';

// Add the missing getStoredNotifications function
export const getStoredNotifications = (userType) => {
  try {
    const storedNotifications = localStorage.getItem('notifications');
    if (!storedNotifications) return [];
    
    const allNotifications = JSON.parse(storedNotifications);
    
    // Filter notifications by userType if specified
    if (userType) {
      return allNotifications.filter(notification => 
        !notification.userType || notification.userType === userType
      );
    }
    
    return allNotifications;
  } catch (error) {
    console.error('Error retrieving stored notifications:', error);
    return [];
  }
};

// Add a function to store notifications
export const storeNotifications = (notifications) => {
  try {
    localStorage.setItem('notifications', JSON.stringify(notifications));
    return true;
  } catch (error) {
    console.error('Error storing notifications:', error);
    return false;
  }
};

// Create axios instance with base URL
export const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000'
});

// Create a custom hook that returns an axios instance with auth interceptors
export const useAxios = () => {
  const instance = axios.create({
    baseURL: 'http://localhost:3000',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  // Request interceptor
  instance.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }, error => {
    return Promise.reject(error);
  });
  
  // Response interceptor for handling common errors
  instance.interceptors.response.use(
    response => response,
    error => {
      // Handle authentication errors
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        const userType = localStorage.getItem('adminID') ? 'admin' : 'faculty';
        toast.error(`Your session has expired. Please log in again.`);
        
        // Clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('adminID');
        localStorage.removeItem('adminName');
        localStorage.removeItem('facultyID');
        localStorage.removeItem('facultyName');
        
        // Redirect based on user type
        setTimeout(() => {
          window.location.href = userType === 'admin' ? '/admin-login' : '/faculty-login';
        }, 1000);
      }
      
      // Handle network errors
      if (error.code === 'ERR_NETWORK') {
        toast.error('Network error. Please check your connection.');
      }
      
      return Promise.reject(error);
    }
  );
  
  return instance;
};

// Setup global interceptors for default axios instance
export const setupGlobalInterceptors = () => {
  // Request interceptor
  axios.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }, error => {
    return Promise.reject(error);
  });
  
  // Response interceptor
  axios.interceptors.response.use(
    response => response,
    error => {
      if (error.response && error.response.status === 401) {
        console.log('Unauthorized request - redirecting to login');
        
        // Clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('adminID');
        localStorage.removeItem('facultyID');
        
        // Let component-specific error handlers deal with redirection
      }
      return Promise.reject(error);
    }
  );
};

export const saveNotifications = (notifications, userType) => {
  localStorage.setItem(`notifications_${userType}`, JSON.stringify(notifications));
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