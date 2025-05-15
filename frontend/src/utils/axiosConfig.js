import axios from 'axios';
import toast from 'react-hot-toast';

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
        // Check if we're already on a login page
        const currentPath = window.location.pathname;
        if (currentPath.includes('login')) {
          return Promise.reject(error);
        }

        const userType = localStorage.getItem('adminID') ? 'admin' : 'faculty';
        
        // Only show the toast error if it's not an expired token error during validation
        if (!error.config.url.includes('/admin/process-validation')) {
          toast.error(`Your session has expired. Please log in again.`);
        }
        
        // Clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('adminID');
        localStorage.removeItem('adminName');
        localStorage.removeItem('facultyID');
        localStorage.removeItem('facultyName');
        
        // Store the current URL to redirect back after login
        localStorage.setItem('redirectAfterLogin', window.location.pathname);
        
        // Redirect based on user type
        const loginPath = userType === 'admin' ? '/admin-login' : '/faculty-login';
        if (window.location.pathname !== loginPath) {
          window.location.href = loginPath;
        }
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