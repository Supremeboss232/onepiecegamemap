import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';

export function VivreCardPanel({ playerId, token }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (playerId && token) {
      apiClient.init(playerId, token);
      fetchCards();
    }
  }, [playerId, token]);

  const fetchCards = async () => {
    try {
      const result = await apiClient.getVivreCards();
      if (result.success) {
        setCards(result.cards || []);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getConditionColor = (condition) => {
    if (condition > 75) return 'healthy';
    if (condition > 50) return 'warning';
    if (condition > 25) return 'danger';
    return 'critical';
  };

  return (
    <div className="vivrecard-panel">
      <div className="panel-header">
        <h3>📋 Vivre Cards</h3>
        <span className="card-count">{cards.length}</span>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : cards.length === 0 ? (
        <p className="empty">No vivre cards yet</p>
      ) : (
        <div className="cards-list">
          {cards.map(card => (
            <div key={card.id} className="card-item">
              <div className="card-info">
                <h5>{card.players?.username || 'Unknown'}</h5>
                <p className="bounty">🎯 {card.players?.bounty.toLocaleString()}</p>
              </div>
              <div className={`condition-bar ${getConditionColor(card.condition)}`}>
                <div
                  className="condition-fill"
                  style={{ width: `${card.condition}%` }}
                ></div>
                <span className="condition-text">{card.condition}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default VivreCardPanel;
