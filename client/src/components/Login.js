import React, { useState } from 'react';
import apiClient from '../utils/axios';
import '../styles/Login.css';

function Login({ onLogin, apiUrl }) {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Regular user login
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      
      const response = await apiClient.post(endpoint, formData);
      
      if (isRegister) {
        setError('');
        setFormData({ username: '', email: '', password: '' });
        setIsRegister(false);
        alert('Registration successful! Please login.');
      } else {
        onLogin(response.data.token, response.data.user);
      }
    } catch (err) {
      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        setError('Request timeout. Please check your connection.');
      } else if (err.response) {
        setError(err.response?.data?.error || 'An error occurred');
      } else if (err.message === 'Network Error') {
        setError('Network error. Please check your connection.');
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="logo-section">
          <img src="/assets/logo.png" alt="Valiant Picks Logo" className="login-logo" />
          <h2 className="brand-name">Valiant Picks</h2>
          <p className="brand-tagline">Your Premium Betting Platform</p>
        </div>
        
        <div className="login-header">
          <h1>{isRegister ? 'Register' : 'Login'}</h1>
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

          {isRegister && (
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Loading...' : (isRegister ? 'Register' : 'Login')}
          </button>
        </form>

        <p className="toggle-form">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => setIsRegister(!isRegister)} className="link-btn">
              {isRegister ? 'Login' : 'Register'}
            </button>
          </p>
      </div>
    </div>
  );
}

export default Login;
