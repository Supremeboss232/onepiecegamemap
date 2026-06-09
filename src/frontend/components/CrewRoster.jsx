import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';

export function CrewRoster({ 
  playerState, 
  playerId,
  apiBase, 
  token,
  onRecruitSuccess
}) {
  const [availableCrew, setAvailableCrew] = useState([]);
  const [showRecruitment, setShowRecruitment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recruitingId, setRecruitingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (showRecruitment) {
      fetchAvailableCrew();
    }
  }, [showRecruitment]);

  const fetchAvailableCrew = async () => {
    try {
      setLoading(true);
      const result = await apiClient.getAvailableCrew();
      
      if (!result.success) {
        setError(result.error);
        return;
      }

      setAvailableCrew(result.data.available_crew || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch available crew:', err);
      setError('Failed to load available crew');
    } finally {
      setLoading(false);
    }
  };

  const recruitCharacter = async (characterId) => {
    if (!playerId) {
      setError('Player ID not found');
      return;
    }

    try {
      setRecruitingId(characterId);
      const result = await apiClient.recruitCrewMember(playerId, characterId);

      if (!result.success) {
        setError(result.error);
        return;
      }

      onRecruitSuccess?.();
      fetchAvailableCrew();
      setError(null);
    } catch (err) {
      console.error('Recruitment error:', err);
      setError('Error recruiting crew member');
    } finally {
      setRecruitingId(null);
    }
  };

  const currentCrew = playerState?.crew || [];
  const crewCount = currentCrew.length;
  const crewLimit = playerState?.player?.crew_limit || 10;

  return (
    <div className="crew-roster">
      <div className="roster-header">
        <h3>👥 Crew Roster</h3>
        <div className="crew-stats">
          <span className="crew-count">{crewCount}/{crewLimit}</span>
          <button 
            className="recruit-btn"
            onClick={() => setShowRecruitment(!showRecruitment)}
            disabled={crewCount >= crewLimit}
          >
            {showRecruitment ? 'Hide' : 'Recruit'}
          </button>
        </div>
      </div>

      {/* Current Crew */}
      <div className="current-crew">
        {currentCrew.length > 0 ? (
          currentCrew.map(member => (
            <div key={member.id} className="crew-member">
              <div className="member-avatar">
                {member.role === 'Captain' && '👨‍✈️'}
                {member.role === 'Swordsman' && '⚔️'}
                {member.role === 'Navigator' && '🧭'}
                {member.role === 'Cook' && '👨‍🍳'}
                {member.role === 'Doctor' && '⚕️'}
                {member.role === 'Archaeologist' && '📚'}
                {member.role === 'Musician' && '🎵'}
                {member.role === 'Sniper' && '🎯'}
                {!['Captain', 'Swordsman', 'Navigator', 'Cook', 'Doctor', 'Archaeologist', 'Musician', 'Sniper'].includes(member.role) && '👤'}
              </div>
              <div className="member-info">
                <div className="member-name">{member.name}</div>
                <div className="member-role">{member.role}</div>
                <div className="member-stats">
                  <span className="loyalty" title="Loyalty to captain">❤️ {member.loyalty_score}%</span>
                  <span className="bounty" title="Individual bounty">💰 {(member.bounty || 0).toLocaleString()}</span>
                </div>
              </div>
              <div className="member-actions">
                {member.current_status === 'Mutiny_Risk' && (
                  <span className="alert">⚠️ Mutiny Risk!</span>
                )}
                {member.current_status === 'Abandonment_Risk' && (
                  <span className="alert">⚡ May Abandon</span>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="empty-crew">No crew members yet. Recruit to build your team!</p>
        )}
      </div>

      {/* Recruitment Panel */}
      {showRecruitment && (
        <div className="recruitment-panel">
          <h4>Available Crew</h4>
          {error && <p className="error-message">⚠️ {error}</p>}
          
          {loading ? (
            <p className="loading-text">⏳ Loading available crew...</p>
          ) : availableCrew.length > 0 ? (
            <div className="available-crew-list">
              {availableCrew.map(character => (
                <div key={character.id} className="recruitment-item">
                  <div className="character-card">
                    <div className="character-name">{character.name}</div>
                    <div className="character-details">
                      <div className="detail">Role: {character.role || 'Recruit'}</div>
                      <div className="detail">Bounty: {(character.bounty || 0).toLocaleString()} B</div>
                      <div className="detail">
                        Loyalty: <span className="loyalty-bar">{'█'.repeat(Math.floor(character.loyalty_score / 10))}{'░'.repeat(10 - Math.floor(character.loyalty_score / 10))}</span>
                      </div>
                      <div className="detail">Stats: Str {character.base_str} | Int {character.base_int} | Will {character.base_will}</div>
                    </div>
                    <button 
                      className="recruit-action-btn"
                      onClick={() => recruitCharacter(character.id)}
                      disabled={crewCount >= crewLimit || recruitingId === character.id}
                    >
                      {recruitingId === character.id ? '⏳ Recruiting...' : 'Recruit'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-crew-available">No available crew members in this region</p>
          )}
        </div>
      )}

      <div className="crew-bonuses">
        <h4>Crew Bonuses</h4>
        <div className="bonus-stats">
          <div className="bonus">
            <span>⚔️ Strength:</span>
            <strong>+{currentCrew.reduce((sum, m) => sum + (m.base_str || 0), 0)}</strong>
          </div>
          <div className="bonus">
            <span>🧠 Intelligence:</span>
            <strong>+{currentCrew.reduce((sum, m) => sum + (m.base_int || 0), 0)}</strong>
          </div>
          <div className="bonus">
            <span>💪 Willpower:</span>
            <strong>+{currentCrew.reduce((sum, m) => sum + (m.base_will || 0), 0)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
