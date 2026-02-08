import React from 'react';

function AdminHeader({ title, subtitle, actions }) {
  return (
    <div className="admin-header">
      <div className="admin-header__title">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="admin-header__actions">{actions}</div>}
    </div>
  );
}

export default AdminHeader;
