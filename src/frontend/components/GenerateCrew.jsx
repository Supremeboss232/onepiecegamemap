import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';

export function GenerateCrew({ 
  playerId, 
  token, 
  onCrewUpdated 
}) {
  const [generatedCrew, setGeneratedCrew] = useState([]);
  const [tier, setTier] = useState(1);
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [recruiting, setRecruiting] = useState(null);
  const [error, setError] = useState(null);
  const [costEstimate, setCostEstimate] = useState(0);

  // Initialize apiClient with auth
  useEffect(() => {
    if (playerId && token) {
      apiClient.init(playerId, token);
    }
  }, [playerId, token]);

  // Update cost estimate based on tier
  useEffect(() => {
    const tierCosts = { 1: 10000, 2: 100000, 3: 500000 };
    setCostEstimate(tierCosts[tier] * count);
  }, [tier, count]);

  const generateCrew = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.generateCrew(tier, count);
      if (result.success) {
        setGeneratedCrew(result.crew || []);
      } else {
        setError('Failed to generate crew: ' + result.error);
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError('Failed to generate crew: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const recruitCharacter = async (characterId) => {
    setRecruiting(characterId);
    try {
      const result = await apiClient.recruitCrewMember(playerId, characterId);
      if (result.success) {
        setGeneratedCrew(generatedCrew.filter(c => c.id !== characterId));
        onCrewUpdated?.();
      } else {
        setError('Recruitment failed: ' + result.error);
      }
    } catch (err) {
      console.error('Recruitment error:', err);
      setError('Error recruiting character');
    } finally {
      setRecruiting(null);
    }
  };

  return (
    <div className="generate-crew-panel">
      <div className="crew-header">
        <h3>🎲 Generate Crew</h3>
        <p>Create random characters to recruit into your crew</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <p>⚠️ {error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Generation Controls */}
      <div className="generation-controls">
        <div className="control-group">
          <label htmlFor="tier-select">Tier:</label>
          <select
            id="tier-select"
            value={tier}
            onChange={(e) => setTier(Number(e.target.value))}
            disabled={loading || generatedCrew.length > 0}
          >
            <option value={1}>⭐ Tier 1 (Weak)</option>
            <option value={2}>⭐⭐ Tier 2 (Strong)</option>
            <option value={3}>⭐⭐⭐ Tier 3 (Legendary)</option>
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="count-select">Count:</label>
          <select
            id="count-select"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            disabled={loading || generatedCrew.length > 0}
          >
            {[1, 2, 3, 4, 5, 10, 15, 20].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <button
          className="generate-btn"
          onClick={generateCrew}
          disabled={loading || generatedCrew.length > 0}
        >
          {loading ? '⏳ Generating...' : '🎲 Generate'}
        </button>
      </div>

      {/* Cost Estimate */}
      {!loading && generatedCrew.length === 0 && (
        <div className="cost-estimate">
          <p>Estimated cost: <strong>{costEstimate.toLocaleString()} Berries</strong></p>
          <small>(One-time generation cost)</small>
        </div>
      )}

      {/* Generated Crew List */}
      {generatedCrew.length > 0 && (
        <div className="generated-crew">
          <div className="crew-summary">
            <p><strong>{generatedCrew.length}</strong> characters generated</p>
            <button
              className="generate-new-btn"
              onClick={() => setGeneratedCrew([])}
              disabled={loading}
            >
              Generate Different
            </button>
          </div>

          <div className="crew-grid">
            {generatedCrew.map(character => (
              <div key={character.id} className="character-card">
                {/* Header */}
                <div className="card-header">
                  <h4>{character.name}</h4>
                  <span className={`tier-badge tier-${character.tier}`}>
                    {'⭐'.repeat(character.tier)}
                  </span>
                </div>

                {/* Role & Type */}
                <div className="card-meta">
                  <span className="role">{character.role}</span>
                  {character.hasDevilFruit && (
                    <span className="devil-fruit" title={character.devilFruit}>
                      🍎 {character.devilFruit}
                    </span>
                  )}
                  {character.hasHaki && (
                    <span className="haki" title={character.hakiType}>
                      ⚫ {character.hakiType} Haki
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="card-stats">
                  <div className="stat">
                    <span className="stat-label">STR</span>
                    <span className="stat-value">{character.strength}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">INT</span>
                    <span className="stat-value">{character.intelligence}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">WIL</span>
                    <span className="stat-value">{character.willpower}</span>
                  </div>
                </div>

                {/* Total Stats Bar */}
                <div className="stats-bar">
                  <div className="bar-label">
                    Total: {character.strength + character.intelligence + character.willpower}
                  </div>
                  <div className="bar-fill" style={{
                    width: `${((character.strength + character.intelligence + character.willpower) / 750) * 100}%`
                  }}></div>
                </div>

                {/* Bounty Info */}
                <div className="card-bounty">
                  <span className="bounty-label">💰 Bounty Multiplier:</span>
                  <span className="bounty-value">{character.bountyMultiplier}x</span>
                </div>

                {/* Loyalty */}
                <div className="card-loyalty">
                  <span className="loyalty-label">Loyalty:</span>
                  <div className="loyalty-bar">
                    <div
                      className="loyalty-fill"
                      style={{ width: `${character.loyalty}%` }}
                    ></div>
                  </div>
                  <span className="loyalty-value">{character.loyalty}%</span>
                </div>

                {/* Recruit Button */}
                <button
                  className="recruit-btn"
                  onClick={() => recruitCharacter(character.id)}
                  disabled={recruiting === character.id}
                >
                  {recruiting === character.id ? '⏳ Recruiting...' : '➕ Recruit'}
                </button>
              </div>
            ))}
          </div>

          <div className="crew-footer">
            <small>Click "Recruit" to add characters to your crew</small>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && generatedCrew.length === 0 && (
        <div className="empty-state">
          <p className="empty-message">
            🎲 Click "Generate" to create random crew members
          </p>
          <p className="empty-hint">
            Higher tiers have better stats and rare abilities like Devil Fruits & Haki
          </p>
        </div>
      )}
    </div>
  );
}

export default GenerateCrew;
