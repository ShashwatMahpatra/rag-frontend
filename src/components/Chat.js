import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Chat.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function Chat({ user, onLogout }) {

  // Upload states
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  // Existing states
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [papers, setPapers] = useState([]);
  const [activeTab, setActiveTab] = useState('chat');
  const [history, setHistory] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchPapers();

    setMessages([
      {
        type: 'bot',
        content: `Hi ${user.name}! 👋 I can answer questions across all your indexed documents. What would you like to know?`,
        sources: []
      }
    ]);
  }, [user.name]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Keep the rest of your code EXACTLY the same
  const fetchPapers = async () => {
    try {
      const res = await axios.get(`${API_URL}/list-papers`);
      setPapers(res.data.papers || []);
    } catch (err) {
      console.error('Failed to fetch papers');
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_URL}/history/${user.id}`);
      setHistory(res.data.history || []);
    } catch (err) {
      console.error('Failed to fetch history');
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'history') fetchHistory();
  };

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    const userQuestion = question.trim();
    setQuestion('');

    // Add user message
    setMessages(prev => [...prev, {
      type: 'user',
      content: userQuestion
    }]);

    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/ask`, {
        question: userQuestion,
        user_id: user.id,
        user_name: user.name
      });

      // Add bot response
      setMessages(prev => [...prev, {
        type: 'bot',
        content: res.data.answer,
        sources: res.data.sources || [],
        sourceDetails: res.data.source_details || []  
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        type: 'bot',
        content: 'Sorry, something went wrong. Please try again.',
        sources: []
      }]);
    } finally {
      setLoading(false);
    }
  };

  const exampleQuestions = [
    "What is YOLO and how does it work?",
    "What are Shashwat's skills?",
    "Explain domain adaptation",
  ];
  const handleUpload = async (e) => {
  e.preventDefault();
  if (!uploadFile) return;

  setUploading(true);
  setUploadStatus('');

  const formData = new FormData();
  formData.append('file', uploadFile);

  try {
    const res = await axios.post(`${API_URL}/upload-pdf`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000
    });
    setUploadStatus(`✅ ${res.data.message}`);
    setUploadFile(null);
    fetchPapers(); // refresh papers list
  } catch (err) {
    setUploadStatus('❌ Upload failed. Please try again.');
  } finally {
    setUploading(false);
  }
};

  return (
    <div className="chat-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="logo">📚 Research RAG</div>
        </div>

        <div className="user-info">
          <div className="user-avatar">{user.name[0].toUpperCase()}</div>
          <div className="user-details">
            <div className="user-name">{user.name}</div>
            <div className="user-label">Researcher</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => handleTabChange('chat')}
          >
            💬 Chat
          </button>
          <button
            className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => handleTabChange('history')}
          >
            🕐 History
          </button>
          <button
            className={`nav-item ${activeTab === 'papers' ? 'active' : ''}`}
            onClick={() => handleTabChange('papers')}
          >
            📄 Documents ({papers.length})
          </button>
          <button
            className={`nav-item ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => handleTabChange('upload')}>
              ⬆️ Upload PDF
            </button>
        </nav>

        <button className="logout-btn" onClick={onLogout}>
          Sign Out
        </button>
      </div>

      {/* Main content */}
      <div className="main-content">

        {/* Chat tab */}
        {activeTab === 'chat' && (
          <div className="chat-container">
            <div className="messages-area">
              {messages.map((msg, i) => (
                <div key={i} className={`message ${msg.type}`}>
                  {msg.type === 'bot' && (
                    <div className="bot-avatar">🤖</div>
                  )}
                  <div className="message-content">
                    <div className="message-text">{msg.content}</div>
                   {msg.sourceDetails && msg.sourceDetails.length > 0 && (
  <div className="source-table">
    <div className="source-table-header">
      <span>📎 References</span>
    </div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Document</th>
          <th>Page</th>
          <th>Preview</th>
        </tr>
      </thead>
      <tbody>
        {msg.sourceDetails.map((s, j) => (
          <tr key={j}>
            <td>{j + 1}</td>
            <td>{s.file}</td>
            <td>{s.page}</td>
            <td>{s.preview}...</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="message bot">
                  <div className="bot-avatar">🤖</div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Example questions */}
            {messages.length === 1 && (
              <div className="examples">
                {exampleQuestions.map((q, i) => (
                  <button
                    key={i}
                    className="example-btn"
                    onClick={() => setQuestion(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input area */}
            <form className="input-area" onSubmit={handleAsk}>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask anything about your documents..."
                disabled={loading}
                autoFocus
              />
              <button type="submit" disabled={loading || !question.trim()}>
                {loading ? '...' : '→'}
              </button>
            </form>
          </div>
        )}

        {/* History tab */}
        {activeTab === 'history' && (
          <div className="tab-content">
            <h2>Your Question History</h2>
            {history.length === 0 ? (
              <div className="empty-state">No questions yet. Start chatting!</div>
            ) : (
              <div className="history-list">
                {history.map((item, i) => (
                  <div key={i} className="history-item">
                    <div className="history-question">Q: {item.question}</div>
                    <div className="history-answer">A: {item.answer}</div>
                    <div className="history-meta">
                      {new Date(item.created_at).toLocaleString()}
                      {item.sources && item.sources.map((s, j) => (
                        <span key={j} className="source-tag">{s}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Papers tab */}
        {activeTab === 'papers' && (
          <div className="tab-content">
            <h2>Indexed Documents</h2>
            <div className="papers-grid">
              {papers.map((paper, i) => (
                <div key={i} className="paper-card">
                  <div className="paper-icon">📄</div>
                  <div className="paper-name">{paper}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'upload' && (
  <div className="tab-content">
    <h2>Upload New Document</h2>
    <p style={{color: '#888', fontSize: '14px', marginBottom: '24px'}}>
      Upload a PDF and it will be automatically indexed and searchable.
    </p>

    <form onSubmit={handleUpload} style={{maxWidth: '500px'}}>
      <div style={{
        border: '2px dashed rgba(127,119,221,0.3)',
        borderRadius: '12px',
        padding: '32px',
        textAlign: 'center',
        marginBottom: '16px',
        background: 'rgba(127,119,221,0.05)'
      }}>
        <div style={{fontSize: '32px', marginBottom: '12px'}}>📄</div>
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setUploadFile(e.target.files[0])}
          style={{display: 'none'}}
          id="pdf-upload"
        />
        <label htmlFor="pdf-upload" style={{
          cursor: 'pointer',
          color: '#7f77dd',
          fontSize: '14px',
          fontWeight: '600'
        }}>
          Click to select a PDF
        </label>
        {uploadFile && (
          <div style={{marginTop: '12px', color: '#aaa', fontSize: '13px'}}>
            Selected: {uploadFile.name}
          </div>
        )}
      </div>

      {uploadStatus && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          fontSize: '13px',
          background: uploadStatus.includes('✅')
            ? 'rgba(99,153,34,0.1)'
            : 'rgba(228,75,74,0.1)',
          border: uploadStatus.includes('✅')
            ? '1px solid rgba(99,153,34,0.3)'
            : '1px solid rgba(228,75,74,0.3)',
          color: uploadStatus.includes('✅') ? '#97c459' : '#f09595'
        }}>
          {uploadStatus}
        </div>
      )}

      <button
        type="submit"
        disabled={!uploadFile || uploading}
        style={{
          width: '100%',
          padding: '14px',
          background: 'linear-gradient(135deg, #7f77dd, #534ab7)',
          border: 'none',
          borderRadius: '10px',
          color: 'white',
          fontSize: '15px',
          fontWeight: '600',
          cursor: uploadFile && !uploading ? 'pointer' : 'not-allowed',
          opacity: uploadFile && !uploading ? 1 : 0.5
        }}
      >
        {uploading ? 'Uploading & Indexing...' : 'Upload & Index PDF'}
      </button>
    </form>
  </div>
)}

      </div>
    </div>
  );
}

export default Chat;