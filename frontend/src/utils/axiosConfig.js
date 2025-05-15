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
