import React from 'react';

function AdminCard({ children, className = '' }) {
  return <div className={`admin-card ${className}`.trim()}>{children}</div>;
}

export default AdminCard;
