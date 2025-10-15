import React from 'react';

const StatusBadge = ({ status, className = '' }) => {
  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'fine':
        return {
          label: '✅ Fine',
          className: 'status-badge status-fine'
        };
      case 'mild issue':
        return {
          label: '⚠️ Mild Issue',
          className: 'status-badge status-mild'
        };
      case 'urgent':
        return {
          label: '🚨 Urgent',
          className: 'status-badge status-urgent'
        };
      case 'pending':
        return {
          label: '⏳ Pending',
          className: 'status-badge bg-gray-100 text-gray-800'
        };
      case 'sent':
        return {
          label: '📤 Sent',
          className: 'status-badge bg-blue-100 text-blue-800'
        };
      case 'delivered':
        return {
          label: '✅ Delivered',
          className: 'status-badge bg-green-100 text-green-800'
        };
      case 'failed':
        return {
          label: '❌ Failed',
          className: 'status-badge bg-red-100 text-red-800'
        };
      case 'cancelled':
        return {
          label: '🚫 Cancelled',
          className: 'status-badge bg-gray-100 text-gray-800'
        };
      default:
        return {
          label: status || 'Unknown',
          className: 'status-badge bg-gray-100 text-gray-800'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={`${config.className} ${className}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;
