// ValidationStatusBadge.jsx
import React from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faTimesCircle, faClock, faInfoCircle, faSync, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";

const ValidationStatusBadge = ({ status, timestamp, formatDate, isConnected = true }) => {
  // Define status configuration
  const statusConfig = {
    pending: {
      icon: faClock,
      color: 'yellow',
      label: 'Pending Approval',
      prefix: 'Submitted:',
    },
    approved: {
      icon: faCheckCircle,
      color: 'green',
      label: 'Grades Approved',
      prefix: 'Approved:',
    },
    rejected: {
      icon: faTimesCircle,
      color: 'red',
      label: 'Grades Rejected',
      prefix: 'Rejected:',
    },
    ready: {
      icon: faInfoCircle,
      color: 'blue',
      label: 'Ready for Validation',
      prefix: null,
    }
  };

  // Determine which status to display
  let statusType = 'ready';
  
  if (status.hasPendingRequest) {
    statusType = 'pending';
  } else if (status.isApproved) {
    statusType = 'approved';
  } else if (status.isRejected) {
    statusType = 'rejected';
  }
  
  const config = statusConfig[statusType];
  
  return (
    <div className={`flex items-center px-4 py-2 bg-${config.color}-50 border-l-4 border-${config.color}-500 rounded relative`}>
      <FontAwesomeIcon icon={config.icon} className={`h-5 w-5 text-${config.color}-500 mr-2`} />
      <div className="flex-grow">
        {/* Connection status indicator */}
        <div className="absolute top-2 right-2 flex items-center">
          {isConnected ? (
            <div className="flex items-center text-xs">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
              <span className="text-green-600">Live</span>
            </div>
          ) : (
            <div className="flex items-center text-xs">
              <FontAwesomeIcon icon={faExclamationTriangle} className="w-2 h-2 text-amber-500 mr-1" />
              <span className="text-amber-600">Offline</span>
            </div>
          )}
        </div>
        <p className={`font-semibold text-${config.color}-700`}>{config.label}</p>
        {timestamp && config.prefix && (
          <p className="text-xs text-gray-500">
            {config.prefix} {formatDate(timestamp)}
          </p>
        )}
      </div>
    </div>
  );
};

export default ValidationStatusBadge;
