import React from 'react';
import '../../styles/AdminDesignSystem.css';

function AdminLayout({ children, className = '' }) {
  return (
    <div className="admin-layout">
      <div className={`admin-container ${className}`.trim()}>{children}</div>
    </div>
  );
}

export default AdminLayout;
