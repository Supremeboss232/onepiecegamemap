import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';

export function AlliancePanel({ playerId, token }) {
  const [alliances, setAlliances] = useState([]);
  const [playerAlliance, setPlayerAlliance] = useState(null);
  const [members, setMembers] = useState([]);
  const [creating, setCreating] = useState(false);
  const [newAllianceName, setNewAllianceName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (playerId && token) {
      apiClient.init(playerId, token);
      loadAlliances();
    }
  }, [playerId, token]);

  const loadAlliances = async () => {
    try {
      const [allRes, playerRes] = await Promise.all([
        apiClient.getAllAlliances(),
        apiClient.getPlayerAlliance()
      ]);

      if (allRes.success) {
        setAlliances(allRes.alliances || []);
      }
      if (playerRes.success && playerRes.alliance) {
        setPlayerAlliance(playerRes.alliance);
        const membersRes = await apiClient.getAllianceMembers(playerRes.alliance.id);
        if (membersRes.success) {
          setMembers(membersRes.members || []);
        }
      }
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const createAlliance = async () => {
    if (!newAllianceName.trim()) {
      setError('Alliance name required');
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const result = await apiClient.createAlliance(newAllianceName);
      if (result.success) {
        setNewAllianceName('');
        await loadAlliances();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Creation failed: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const joinAlliance = async (allianceId) => {
    try {
      const result = await apiClient.joinAlliance(allianceId);
      if (result.success) {
        await loadAlliances();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Join failed: ' + err.message);
    }
  };

  return (
    <div className="alliance-panel">
      <div className="panel-header">
        <h3>⚔️ Alliances</h3>
      </div>

      {error && (
        <div className="error-message">
          <p>⚠️ {error}</p>
        </div>
      )}

      {playerAlliance ? (
        <div className="player-alliance">
          <div className="alliance-info">
            <h4>{playerAlliance.name}</h4>
            <p>Members: {playerAlliance.member_count}</p>
            <p>Treasury: 💰 {playerAlliance.treasury.toLocaleString()}</p>
            <p>Total Bounty: 🎯 {playerAlliance.total_bounty.toLocaleString()}</p>
          </div>

          <div className="members-list">
            <h5>Members</h5>
            {members.map(m => (
              <div key={m.id} className="member-item">
                <span className="name">{m.players?.username || 'Unknown'}</span>
                <span className={`role ${m.role.toLowerCase()}`}>{m.role}</span>
                <span className="bounty">{m.players?.bounty.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="no-alliance">
          <div className="create-alliance">
            <h4>Create Alliance</h4>
            <input
              type="text"
              placeholder="Alliance name"
              value={newAllianceName}
              onChange={(e) => setNewAllianceName(e.target.value)}
              disabled={creating}
            />
            <button
              onClick={createAlliance}
              disabled={creating || !newAllianceName.trim()}
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>

          <div className="join-alliance">
            <h4>Join Alliance</h4>
            <div className="alliances-list">
              {alliances.map(a => (
                <div key={a.id} className="alliance-item">
                  <div className="alliance-info">
                    <span className="name">{a.name}</span>
                    <span className="members">{a.member_count} members</span>
                  </div>
                  <button
                    onClick={() => joinAlliance(a.id)}
                    className="join-btn"
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AlliancePanel;
