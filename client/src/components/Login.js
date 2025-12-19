import React, { useState } from 'react';
import axios from 'axios';
import '../styles/Login.css';

function Login({ onLogin, apiUrl }) {
  const [isRegister, setIsRegister] = useState(false);
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Admin login - hardcoded credentials
      if (isAdminLogin) {
        if (formData.username === 'admin' && formData.password === '12345') {
          // Create a proper JWT token for admin
          const payload = JSON.stringify({ id: 0, username: 'admin', is_admin: true });
          const adminToken = btoa(payload); // Simple base64 encoding for client-side token
          onLogin(adminToken, { 
            id: 0, 
            username: 'admin', 
            is_admin: true,
            balance: 0,
            isAdminUser: true
          });
        } else {
          setError('Invalid admin credentials');
        }
      } else {
        // Regular user login
        const endpoint = isRegister ? '/auth/register' : '/auth/login';
        const response = await axios.post(`${apiUrl}${endpoint}`, formData);
        
        if (isRegister) {
          setError('');
          setFormData({ username: '', password: '' });
          setIsRegister(false);
          alert('Registration successful! Please login.');
        } else {
          onLogin(response.data.token, response.data.user);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>{isAdminLogin ? 'Admin Login' : (isRegister ? 'Register' : 'Login')}</h1>
          {!isAdminLogin && !isRegister && (
            <button 
              onClick={() => setIsAdminLogin(true)} 
              className="admin-link"
              title="Admin Login"
            >
              Admin
            </button>
          )}
          {(isAdminLogin || isRegister) && (
            <button 
              onClick={() => {
                setIsAdminLogin(false);
                setIsRegister(false);
                setFormData({ username: '', password: '' });
                setError('');
              }} 
              className="admin-link"
              title="Back to User Login"
            >
              ← Back
            </button>
          )}
        </div>
        
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Loading...' : (isAdminLogin ? 'Login to Admin' : (isRegister ? 'Register' : 'Login'))}
          </button>
        </form>

        {!isAdminLogin && (
          <p className="toggle-form">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button onClick={() => setIsRegister(!isRegister)} className="link-btn">
              {isRegister ? 'Login' : 'Register'}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

export default Login;
