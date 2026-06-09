import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';

export function PoneglyPHPanel({ playerId, token }) {
  const [poneglyphs, setPoneglyphs] = useState([]);
  const [discovering, setDiscovering] = useState(false);
  const [lastDiscovery, setLastDiscovery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (playerId && token) {
      apiClient.init(playerId, token);
      fetchPoneglyphs();
    }
  }, [playerId, token]);

  const fetchPoneglyphs = async () => {
    try {
      const result = await apiClient.getAllPoneglyphs(playerId);
      if (result.success) {
        setPoneglyphs(result.poneglyphs || []);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const attemptDiscovery = async () => {
    setDiscovering(true);
    setError(null);
    try {
      const result = await apiClient.discoverPoneglyph(playerId);
      if (result.success) {
        setLastDiscovery(result);
        if (result.discovered) {
          await fetchPoneglyphs();
        }
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Discovery failed: ' + err.message);
    } finally {
      setDiscovering(false);
    }
  };

  const discoveredCount = poneglyphs.filter(p => p.discovered).length;
  const canAccessLaughTale = discoveredCount >= 5;

  return (
    <div className="poneglyph-panel">
      <div className="panel-header">
        <h3>📜 Poneglyphs</h3>
        <span className={`discovered-count ${canAccessLaughTale ? 'unlocked' : ''}`}>
          {discoveredCount}/9
        </span>
      </div>

      {error && (
        <div className="error-message">
          <p>⚠️ {error}</p>
        </div>
      )}

      {lastDiscovery && (
        <div className={`discovery-result ${lastDiscovery.discovered ? 'success' : 'fail'}`}>
          <p>{lastDiscovery.message}</p>
          {lastDiscovery.discovered && (
            <p className="discovered-name">🎉 {lastDiscovery.poneglyph.name}</p>
          )}
        </div>
      )}

      <button
        className="discovery-btn"
        onClick={attemptDiscovery}
        disabled={discovering || loading}
      >
        {discovering ? '⏳ Discovering...' : '🔍 Attempt Discovery'}
      </button>

      {canAccessLaughTale && (
        <div className="laugh-tale-unlock">
          <p>✨ All poneglyphs discovered! Laugh Tale is now accessible.</p>
        </div>
      )}

      <div className="poneglyphs-list">
        <div className="list-header">Found: {discoveredCount}</div>
        {poneglyphs.map(p => (
          <div key={p.id} className={`poneglyph-item ${p.discovered ? 'discovered' : 'hidden'}`}>
            <span className="name">{p.discovered ? p.name : '???'}</span>
            <span className="location">{p.discovered ? p.location : 'Unknown'}</span>
            {p.discovered && <span className="lore">💭 {p.lore}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PoneglyPHPanel;
