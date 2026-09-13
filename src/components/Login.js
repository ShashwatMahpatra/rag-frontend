import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
console.log('API URL:', API_URL);

function Login({ onLogin }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/register`, { name: name.trim() });
      if (response.data.user_id) {
        onLogin({
          id: response.data.user_id,
          name: response.data.name
        });
      } else {
        setError('Failed to register. Please try again.');
      }
    } catch (err) {
      setError('Cannot connect to server. Make sure api.py is running!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-icon">📚</div>
        <h1>Research RAG</h1>
        <p className="login-subtitle">
          Ask questions across all your research papers, books, and documents
        </p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name to get started"
              autoFocus
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading || !name.trim()}>
            {loading ? 'Setting up...' : 'Start Asking →'}
          </button>
        </form>

        <div className="login-features">
          <div className="feature">🔍 Semantic search across all PDFs</div>
          <div className="feature">🤖 AI-powered answers with sources</div>
          <div className="feature">📝 Your question history saved</div>
        </div>
      </div>
    </div>
  );
}

export default Login;