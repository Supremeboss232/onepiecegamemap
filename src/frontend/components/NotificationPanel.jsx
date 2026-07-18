import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';

export function NotificationPanel({ playerId, token, websocketRef, apiBase }) {
  const [notifications, setNotifications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (websocketRef?.current) {
      const handleMessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'den_den_mushi_message') {
            const newMsg = {
              id: Date.now(),
              from: data.from,
              message: data.message,
              timestamp: new Date(),
              isIntercepted: data.isIntercepted || false
            };
            setMessages(prev => [newMsg, ...prev].slice(0, 50)); // Keep last 50
            addNotification(`📱 Message from ${data.from.substring(0, 8)}`);
          }

          if (data.type === 'invasion_alert') {
            addNotification(`⚠️ INVASION! Enemy approaching in ${data.countdown}s`);
          }

          if (data.type === 'crew_event') {
            addNotification(`👥 Crew: ${data.message}`);
          }

          if (data.type === 'territory_alert') {
            addNotification(`🏰 Territory: ${data.message}`);
          }

          if (data.type === 'bounty_update') {
            addNotification(`💰 Bounty: ${data.message}`);
          }

          if (data.type === 'alliance_event') {
            addNotification(`🤝 Alliance: ${data.message}`);
          }
        } catch (err) {
          console.error('WebSocket message parse error:', err);
        }
      };

      websocketRef.current.addEventListener('message', handleMessage);
      return () => websocketRef.current?.removeEventListener('message', handleMessage);
    }
  }, [websocketRef]);

  const addNotification = (message) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, timestamp: new Date() }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000); // Auto-dismiss after 5s
  };

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !recipientId.trim() || !playerId) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setSendingMessage(true);
      setError(null);

      const result = await apiClient.sendMessage(playerId, recipientId, newMessage);

      if (!result.success) {
        setError(result.error);
        return;
      }

      // Add to local message log
      const sentMsg = {
        id: Date.now(),
        from: 'You',
        message: newMessage,
        timestamp: new Date(),
        isIntercepted: false
      };
      setMessages(prev => [sentMsg, ...prev].slice(0, 50));
      setNewMessage('');
      setRecipientId('');
      addNotification('📤 Message sent!');
    } catch (err) {
      console.error('Send message error:', err);
      setError('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="notification-panel">
      <div className="notification-header">
        <h3>📱 Den Den Mushi</h3>
        <button 
          className="toggle-btn" 
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? '▼' : '▶'}
        </button>
      </div>

      {isOpen && (
        <div className="notification-content">
          {/* Active Notifications */}
          <div className="active-notifications">
            {notifications.length > 0 && (
              <>
                <h4>Active Alerts</h4>
                {notifications.map(notif => (
                  <div key={notif.id} className="notification-alert">
                    <span>{notif.message}</span>
                    <button 
                      className="close-btn"
                      onClick={() => dismissNotification(notif.id)}
                    >✕</button>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Message Composer */}
          <div className="message-composer">
            <h4>Send Message</h4>
            {error && <p className="error-message">⚠️ {error}</p>}
            <form onSubmit={handleSendMessage}>
              <input
                type="text"
                placeholder="Recipient Player ID"
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                disabled={sendingMessage}
              />
              <textarea
                placeholder="Your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={sendingMessage}
                rows="2"
              />
              <button 
                type="submit"
                disabled={sendingMessage || !newMessage.trim()}
              >
                {sendingMessage ? '⏳ Sending...' : '📤 Send'}
              </button>
            </form>
          </div>

          {/* Message History */}
          <div className="message-history">
            <h4>Message Log ({messages.length})</h4>
            {messages.length > 0 ? (
              messages.slice(0, 10).map(msg => (
                <div 
                  key={msg.id} 
                  className={`message-item ${msg.isIntercepted ? 'intercepted' : ''}`}
                >
                  <div className="message-header">
                    <span className="sender">{msg.from.substring(0, 8)}</span>
                    <span className="time">
                      {msg.timestamp.toLocaleTimeString()}
                    </span>
                    {msg.isIntercepted && <span className="intercepted-badge">🔓 Intercepted</span>}
                  </div>
                  <div className="message-body">{msg.message}</div>
                </div>
              ))
            ) : (
              <p className="no-messages">No messages yet...</p>
            )}
          </div>
        </div>
      )}

      {/* Notification Counter Badge */}
      {notifications.length > 0 && (
        <span className="notification-badge">{notifications.length}</span>
      )}
    </div>
  );
}
