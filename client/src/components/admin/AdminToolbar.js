import React from 'react';

function AdminToolbar({ left, right, children }) {
  if (children) {
    return <div className="admin-toolbar">{children}</div>;
  }

  return (
    <div className="admin-toolbar">
      <div className="admin-toolbar__left">{left}</div>
      <div className="admin-toolbar__right">{right}</div>
    </div>
  );
}

export default AdminToolbar;
