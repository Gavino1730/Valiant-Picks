import React from 'react';

function AdminActionsMenu({ label = 'Actions', align = 'right', children }) {
  return (
    <details className={`admin-actions-menu admin-actions-menu--${align}`}>
      <summary className="admin-actions-menu__summary">{label}</summary>
      <div className="admin-actions-menu__panel">{children}</div>
    </details>
  );
}

export default AdminActionsMenu;
