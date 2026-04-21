import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';

// const API = 'http://localhost:5000/api';
const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('teacher');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (isLogin) {
        // Login Flow
        const res = await axios.post(`${API}/auth/login`, { email, password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        if (res.data.user.role === 'teacher') navigate('/teacher');
        else if (res.data.user.role === 'parent') navigate('/parent');
      } else {
        // Register Flow
        await axios.post(`${API}/auth/register`, { name, email, password, role });
        setSuccessMsg('Account created successfully! You can now sign in.');
        setIsLogin(true); // Switch to login screen
        setPassword('');
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError(isLogin ? 'Invalid email or password! Or Server Error' : 'Error creating account!');
      }
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card" style={{ paddingBottom: '20px' }}>
        <div className="login-logo">📚</div>
        <h1 className="login-title">EduTrack</h1>
        <p className="login-subtitle">Student Track Record & PTM Suite</p>

        {/* Role Selector */}
        <div className="role-selector">
          <button
            className={`role-btn ${role === 'teacher' ? 'active' : ''}`}
            onClick={() => setRole('teacher')}
            type="button"
          >
            🧑‍🏫 Teacher
          </button>
          <button
            className={`role-btn ${role === 'parent' ? 'active' : ''}`}
            onClick={() => setRole('parent')}
            type="button"
          >
            👨‍👩‍👧 Parent
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          
          {!isLogin && (
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="error-msg" style={{color: 'red', textAlign: 'center'}}>{error}</p>}
          {successMsg && <p className="success-msg" style={{color: 'green', textAlign: 'center', fontWeight: 'bold'}}>{successMsg}</p>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Please wait...' : (isLogin ? 'Sign In →' : 'Sign Up →')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '15px' }}>
          <button 
            type="button" 
            style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setSuccessMsg('');
            }}
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Login;