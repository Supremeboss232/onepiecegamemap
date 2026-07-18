import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';

export function LeaderboardPanel({ playerId, token }) {
  const [tab, setTab] = useState('bounty'); // bounty, poneglyphs, alliances
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (playerId && token) {
      apiClient.init(playerId, token);
      fetchRankings();
    }
  }, [tab, playerId, token]);

  const fetchRankings = async () => {
    setLoading(true);
    try {
      let result;
      if (tab === 'bounty') {
        result = await apiClient.getBountyLeaderboard(20);
      } else if (tab === 'poneglyphs') {
        result = await apiClient.getPoneglyPHLeaderboard(20);
      } else {
        result = await apiClient.getAllianceLeaderboard(20);
      }

      if (result.success) {
        setRankings(result.rankings || result.alliances || []);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMedalEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="leaderboard-panel">
      <div className="panel-header">
        <h3>🏆 Leaderboard</h3>
      </div>

      <div className="tab-buttons">
        <button
          className={`tab-btn ${tab === 'bounty' ? 'active' : ''}`}
          onClick={() => setTab('bounty')}
        >
          💰 Bounty
        </button>
        <button
          className={`tab-btn ${tab === 'poneglyphs' ? 'active' : ''}`}
          onClick={() => setTab('poneglyphs')}
        >
          📜 Poneglyphs
        </button>
        <button
          className={`tab-btn ${tab === 'alliances' ? 'active' : ''}`}
          onClick={() => setTab('alliances')}
        >
          ⚔️ Alliances
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : rankings.length === 0 ? (
        <p>No data yet</p>
      ) : (
        <div className="rankings-list">
          {rankings.map((item, idx) => (
            <div key={item.id || idx} className="ranking-item">
              <span className="rank">{getMedalEmoji(idx + 1)}</span>
              <span className="name">{item.username || item.name}</span>
              {tab === 'bounty' && (
                <span className="value">💰 {item.total_bounty?.toLocaleString()}</span>
              )}
              {tab === 'poneglyphs' && (
                <span className="value">📜 {item.poneglyphs_found || 0}</span>
              )}
              {tab === 'alliances' && (
                <span className="value">🎯 {item.total_bounty?.toLocaleString()}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LeaderboardPanel;
