// notification.jsx - Utility functions for handling notifications
import React from 'react';

/**
 * Show a styled toast notification for validation status changes
 * @param {object} toast - The toast instance from react-hot-toast
 * @param {string} status - The validation status ('approved', 'rejected', 'pending')
 * @param {string} message - Optional custom message
 * @param {string} id - Optional toast ID for replacing existing toasts
 */
export const showValidationStatusNotification = (toast, status, message, id = undefined) => {
  const toastId = id || `validation-${Date.now()}`;
  const isApproved = status === 'approved' || status === 'approve';
  const isRejected = status === 'rejected' || status === 'reject';
  const isPending = status === 'pending';
  
  let title = '';
  let icon = '';
  let borderColor = '';
  let defaultMessage = '';
  
  if (isApproved) {
    title = 'Grades Approved!';
    icon = '✓';
    borderColor = '#10B981'; // green-500
    defaultMessage = 'Your grade validation request has been approved.';
  } else if (isRejected) {
    title = 'Grades Rejected';
    icon = '✗';
    borderColor = '#EF4444'; // red-500
    defaultMessage = 'Your grade validation request has been rejected.';
  } else if (isPending) {
    title = 'Validation Requested';
    icon = '⏳';
    borderColor = '#F59E0B'; // amber-500
    defaultMessage = 'Your grade validation request is pending approval.';
  } else {
    title = 'Validation Status';
    icon = 'ℹ';
    borderColor = '#3B82F6'; // blue-500
    defaultMessage = 'Grade validation status updated.';
  }
  
  toast(
    <div className="flex items-center">
      <div className="mr-2 text-xl">{icon}</div>
      <div>
        <p className="font-bold">{title}</p>
        <p className="text-sm">{message || defaultMessage}</p>
      </div>
    </div>,
    {
      id: toastId,
      duration: 5000,
      position: 'top-center',
      style: {
        borderLeft: `6px solid ${borderColor}`,
        padding: '12px',
      },
    }
  );
  
  return toastId;
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
