// notification.js - Utility functions for handling notifications
import React from 'react';
// Import the JSX version of the notification function
import { showValidationStatusNotification as jsxShowNotification } from './notification.jsx';

/**
 * Show a styled toast notification for validation status changes
 * @param {object} toast - The toast instance from react-hot-toast
 * @param {string} status - The validation status ('approved', 'rejected', 'pending')
 * @param {string} message - Optional custom message
 * @param {string} id - Optional toast ID for replacing existing toasts
 */
export const showValidationStatusNotification = (toast, status, message, id = undefined) => {
  // Forward the call to the JSX version for all notification logic
  return jsxShowNotification(toast, status, message, id);
};

/**
 * Format a timestamp with custom options
 * @param {string|Date} timestamp - The timestamp to format
 * @param {object} options - Formatting options
 * @returns {string} Formatted date string
 */
export const formatTimestamp = (timestamp, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  
  const dateOptions = { ...defaultOptions, ...options };
  return new Date(timestamp).toLocaleString('en-US', dateOptions);
};