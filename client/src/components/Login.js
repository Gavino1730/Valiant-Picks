import React, { useState } from 'react';
import axios from 'axios';
import '../styles/Login.css';

function Login({ onLogin, apiUrl }) {
  const [isRegister, setIsRegister] = useState(false);
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
      // Regular user login
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      
      // Add timeout for API request (10 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await axios.post(`${apiUrl}${endpoint}`, formData, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (isRegister) {
        setError('');
        setFormData({ username: '', password: '' });
        setIsRegister(false);
        alert('Registration successful! Please login.');
      } else {
        onLogin(response.data.token, response.data.user);
      }
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        setError('Request timeout. Please check your connection and try again.');
      } else if (err.response) {
        setError(err.response?.data?.error || 'An error occurred');
      } else if (err.message === 'Network Error') {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(err.message || 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
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
