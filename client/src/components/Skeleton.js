import React from 'react';
import '../styles/Skeleton.css';

// Reusable skeleton component for loading states
function Skeleton({ variant = 'text', width, height, style, count = 1, className = '' }) {
  const skeletons = Array.from({ length: count }).map((_, idx) => {
    const skeletonStyle = {
      width: width || (variant === 'text' ? '100%' : undefined),
      height: height || (variant === 'text' ? '1em' : variant === 'card' ? '200px' : '20px'),
      ...style
    };

    return (
      <div
        key={idx}
        className={`skeleton skeleton-${variant} ${className}`}
        style={skeletonStyle}
      />
    );
  });

  return count === 1 ? skeletons[0] : <>{skeletons}</>;
}

// Pre-configured skeleton components for common use cases
export function GameCardSkeleton() {
  return (
    <div className="game-card-display skeleton-card">
      <div className="skeleton-row">
        <Skeleton variant="badge" width="80px" height="24px" />
        <Skeleton variant="pill" width="100px" height="22px" />
      </div>
      <Skeleton variant="text" height="24px" style={{ marginTop: '10px' }} />
      <Skeleton variant="text" height="18px" width="60%" style={{ marginTop: '6px' }} />
      <div className="skeleton-stack" style={{ marginTop: '16px' }}>
        <Skeleton variant="text" height="16px" />
        <Skeleton variant="text" height="16px" width="70%" />
        <Skeleton variant="text" height="16px" width="50%" />
      </div>
    </div>
  );
}

export function LeaderboardRowSkeleton() {
  return (
    <tr className="leaderboard-row skeleton-row">
      <td className="rank-cell">
        <Skeleton variant="circle" width="26px" height="26px" />
      </td>
      <td>
        <Skeleton variant="text" width="140px" height="16px" />
      </td>
      <td className="numeric">
        <Skeleton variant="text" width="90px" height="16px" />
      </td>
      <td className="numeric">
        <Skeleton variant="text" width="90px" height="16px" />
      </td>
      <td className="numeric">
        <Skeleton variant="text" width="70px" height="16px" />
      </td>
      <td className="numeric">
        <Skeleton variant="text" width="60px" height="16px" />
      </td>
    </tr>
  );
}

export function DashboardCardSkeleton() {
  return (
    <div className="dashboard-stat-card skeleton-card">
      <Skeleton variant="text" width="100px" height="16px" />
      <Skeleton variant="text" width="80px" height="32px" style={{ marginTop: '8px' }} />
    </div>
  );
}

export function UpcomingGameSkeleton() {
  return (
    <div className="upcoming-game-item skeleton-item">
      <Skeleton variant="text" height="18px" width="100%" />
      <Skeleton variant="text" height="14px" width="60%" style={{ marginTop: '4px' }} />
    </div>
  );
}

export default Skeleton;
