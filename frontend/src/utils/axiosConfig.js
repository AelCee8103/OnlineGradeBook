import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Create an axios instance with default config
export const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000'
});

// Add a request interceptor to include auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Create a hook to use axios with navigation capabilities
export const useAxios = () => {
  const navigate = useNavigate();
  
  // Create a new instance for this component with interceptors
  const instance = axios.create({
    baseURL: 'http://localhost:3000'
  });
  
  // Add request interceptor to this instance
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Add a response interceptor to handle auth errors
  instance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.error('Authentication error:', error.response.data.message || 'Session expired');
        
        // Clear auth data
        localStorage.removeItem('token');
        
        // Redirect based on user type
        if (localStorage.getItem('adminID')) {
          localStorage.removeItem('adminID');
          localStorage.removeItem('adminName');
          navigate('/admin-login');
        } else if (localStorage.getItem('facultyID')) {
          localStorage.removeItem('facultyID');
          localStorage.removeItem('facultyName');
          navigate('/faculty-login');
        } else {
          // Default fallback
          navigate('/');
        }
      }
      return Promise.reject(error);
    }
  );

  // Return the instance with the interceptors that we just configured
  // NOT the global axiosInstance
  return instance;
};

// Export a function to set up global interceptors without react hooks
export const setupGlobalInterceptors = () => {
  // Track if we're already redirecting to prevent multiple alerts
  let isRedirecting = false;

  // Add a response interceptor to handle auth errors
  axios.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (!isRedirecting && 
          error.response && 
          (error.response.status === 401 || error.response.status === 403)) {
        
        isRedirecting = true;
        console.error('Authentication error:', error.response.data.message || 'Session expired');
        
        // Clear auth data
        localStorage.removeItem('token');
        
        // We can't use navigate here, so alert the user
        const errorMsg = error.response.data.message || 'Your session has expired. Please log in again.';
        alert(errorMsg);
        
        // Redirect based on user type with a small delay to allow the alert to be seen
        setTimeout(() => {
          if (localStorage.getItem('adminID')) {
            localStorage.removeItem('adminID');
            localStorage.removeItem('adminName');
            window.location.href = '/admin-login';
          } else if (localStorage.getItem('facultyID')) {
            localStorage.removeItem('facultyID');
            localStorage.removeItem('facultyName');
            window.location.href = '/faculty-login';
          } else {
            // Default fallback
            window.location.href = '/';
          }
          // Reset the redirect flag after a while
          setTimeout(() => {
            isRedirecting = false;
          }, 2000);
        }, 100);
      }
      return Promise.reject(error);
    }
  );
};
