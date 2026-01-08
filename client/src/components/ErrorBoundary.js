import React from 'react';
import { logError } from '../utils/errorLogging';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Log error to backend
    logError(error, {
      severity: 'critical',
      type: 'componentError',
      componentStack: errorInfo.componentStack
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#0f1419',
          color: '#e0e0e0',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h1 style={{ color: '#1f4e99', marginBottom: '20px' }}>Something went wrong</h1>
          <p style={{ marginBottom: '30px', maxWidth: '500px' }}>
            We encountered an unexpected error. Please try refreshing the page.
          </p>
          <button
            onClick={this.handleReset}
            style={{
              padding: '12px 24px',
              backgroundColor: '#1f4e99',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
