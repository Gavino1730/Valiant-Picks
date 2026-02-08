import React from 'react';

function AdminTable({ children, className = '' }) {
  return (
    <div className="admin-table-wrapper">
      <table className={`admin-table ${className}`.trim()}>{children}</table>
    </div>
  );
}

export default AdminTable;
