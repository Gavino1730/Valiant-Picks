import React, { useState } from 'react';
import apiClient from '../utils/axios';
import { validateUsername, validatePassword, validateEmail, getPasswordStrength } from '../utils/validation';
import '../styles/Login.css';

function Login({ onLogin, apiUrl }) {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);

  const EyeIcon = ({ crossed = false }) => (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 12c2.1-4 6.1-6.5 10-6.5s7.9 2.5 10 6.5c-2.1 4-6.1 6.5-10 6.5S4.1 16 2 12Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {crossed && (
        <path
          d="m5 5 14 14"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      )}
    </svg>
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Real-time validation
    let error = '';
    if (name === 'username') {
      error = validateUsername(value);
    } else if (name === 'email' && isRegister) {
      error = validateEmail(value);
    } else if (name === 'password') {
      error = validatePassword(value);
      if (isRegister && value) {
        setPasswordStrength(getPasswordStrength(value));
      }
    }
    
    if (error) {
      setValidationErrors(prev => ({ ...prev, [name]: error }));
    } else {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate before submitting
    const usernameError = validateUsername(formData.username);
    const passwordError = validatePassword(formData.password);
    const emailError = isRegister ? validateEmail(formData.email) : '';
    
    const errors = {
      username: usernameError,
      password: passwordError,
      ...(isRegister && { email: emailError })
    };
    
    setValidationErrors(errors);
    
    if (Object.values(errors).some(e => e)) {
      return;
    }
    
    setLoading(true);

    try {
      // Regular user login
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      
      const response = await apiClient.post(endpoint, formData, {
        timeout: 10000
      });
      
      if (isRegister) {
        setError('');
        setFormData({ username: '', email: '', password: '' });
        setValidationErrors({});
        setPasswordStrength(null);
        setIsRegister(false);
        alert('Registration successful! Please login.');
      } else {
        onLogin(response.data.token, response.data.user);
      }
    } catch (err) {
      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        setError('Request timeout. Please check your connection and try again.');
      } else if (err.response?.status === 409) {
        setError('Username already exists. Please choose another.');
      } else if (err.response?.status === 401) {
        setError('Invalid username or password. Please try again.');
      } else if (err.response) {
        setError(err.response?.data?.error || 'An error occurred. Please try again.');
      } else if (err.message === 'Network Error') {
        setError('Network error. Please check your internet connection.');
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
          <img 
            src="/assets/logo.png" 
            alt="Valiant Picks Logo" 
            className="login-logo" 
            width="200" 
            height="200"
            loading="eager"
          />
          <h2 className="brand-name">Valiant Picks</h2>
          <p className="brand-tagline">Your Premium Betting Platform</p>
        </div>

        {/* Info Section - What is Valiant Picks */}
        <div className="info-section">
          <div className="info-card">
            <div className="info-icon">🎮</div>
            <h3>Virtual Betting, Real Excitement</h3>
            <p>
              Place bets on Valiant Academy basketball games using virtual <strong>Valiant Bucks</strong> – no real money involved!
            </p>
          </div>
          <div className="info-features">
            <div className="feature-item">
              <span className="feature-icon">💰</span>
              <span>100% Free to Play</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🏆</span>
              <span>Compete on Leaderboards</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🎯</span>
              <span>Support Your Favorite Teams</span>
            </div>
          </div>
        </div>

        {!isRegister && (
          <div className="toggle-form" style={{marginTop: '1.5rem', marginBottom: '1.5rem', paddingTop: 0, borderTop: 'none'}}>
            <p className="toggle-text">
              Don't have an account?
            </p>
            <button onClick={() => setIsRegister(true)} className="register-btn">
              Create Account
            </button>
          </div>
        )}
        
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
              className={validationErrors.username ? 'input-error' : ''}
              required
              aria-describedby={validationErrors.username ? 'username-error' : undefined}
            />
            {validationErrors.username && (
              <span id="username-error" className="error-message">{validationErrors.username}</span>
            )}
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
                className={validationErrors.email ? 'input-error' : ''}
                required
                aria-describedby={validationErrors.email ? 'email-error' : undefined}
              />
              {validationErrors.email && (
                <span id="email-error" className="error-message">{validationErrors.email}</span>
              )}
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
                className={validationErrors.password ? 'input-error' : ''}
                required
                aria-describedby={validationErrors.password ? 'password-error' : undefined}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <EyeIcon crossed={!showPassword} />
              </button>
            </div>
            {validationErrors.password && (
              <span id="password-error" className="error-message">{validationErrors.password}</span>
            )}
            {isRegister && passwordStrength && (
              <div className="password-strength" style={{marginTop: '0.5rem'}}>
                <div className="strength-meter" style={{background: passwordStrength.score < 2 ? '#ef5350' : passwordStrength.score < 4 ? '#ffb74d' : '#66bb6a'}}></div>
                <span style={{fontSize: '0.85rem', color: passwordStrength.score < 2 ? '#ef5350' : passwordStrength.score < 4 ? '#ffb74d' : '#66bb6a'}}>
                  Strength: {passwordStrength.label}
                </span>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="btn" 
            disabled={loading || Object.values(validationErrors).some(e => e)}
            aria-busy={loading}
          >
            {loading ? 'Loading...' : (isRegister ? 'Register' : 'Login')}
          </button>
        </form>

        {isRegister && (
          <div className="toggle-form">
            <p className="toggle-text">
              Already have an account?
            </p>
            <button onClick={() => setIsRegister(false)} className="register-btn">
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
