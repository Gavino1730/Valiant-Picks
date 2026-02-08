import React from 'react';

function AdminBadge({ variant = 'neutral', children }) {
  return <span className={`admin-badge admin-badge--${variant}`}>{children}</span>;
}

export default AdminBadge;
