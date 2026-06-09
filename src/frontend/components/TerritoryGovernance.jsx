import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';

export function TerritoryGovernance({ 
  playerState,
  gameState,
  playerId,
  selectedShip,
  apiBase, 
  token,
  onTerritoryUpdate
}) {
  const [territories, setTerritories] = useState([]);
  const [selectedTerritory, setSelectedTerritory] = useState(null);
  const [governanceMode, setGovernanceMode] = useState('Protection_Flag');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTerritories();
  }, []);

  const fetchTerritories = async () => {
    try {
      setError(null);
      const result = await apiClient.getTerritories();
      
      if (!result.success) {
        setError(result.error);
        return;
      }

      const playerTerritories = result.data.territories?.filter(t => t.owner_id === playerId) || [];
      setTerritories(playerTerritories);
    } catch (err) {
      console.error('Failed to fetch territories:', err);
      setError('Failed to load territories');
    }
  };

  const claimTerritory = async () => {
    if (!selectedShip) {
      setError('Select a ship first');
      return;
    }

    if (!playerId) {
      setError('Player ID not found');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.claimTerritory(playerId, selectedShip.id, governanceMode);

      if (!result.success) {
        setError(result.error);
        return;
      }

      fetchTerritories();
      onTerritoryUpdate?.();
      setError(null);
    } catch (err) {
      console.error('Territory claim error:', err);
      setError('Error claiming territory');
    } finally {
      setLoading(false);
    }
  };

  const governanceModes = [
    {
      id: 'Protection_Flag',
      name: '🏴 Protection Flag',
      description: 'Neutral governance. No special rules.',
      icon: '🏴'
    },
    {
      id: 'Tyranny',
      name: '👑 Tyranny',
      description: 'Harsh rule. Generate more revenue but risk rebellions.',
      icon: '👑',
      requiresStr: 150
    },
    {
      id: 'Shadow_Puppet',
      name: '👤 Shadow Puppet',
      description: 'Hidden control. Other players think it\'s unclaimed.',
      icon: '👤',
      requiresInt: 150
    }
  ];

  const currentNode = gameState?.nodes?.find(n => n.id === selectedShip?.node_id);
  const nodeTerritory = territories.find(t => t.node_id === selectedShip?.node_id);

  return (
    <div className="territory-governance">
      <div className="governance-header">
        <h3>🏰 Territory Control</h3>
        <span className="territory-count">
          {territories.length} territories controlled
        </span>
      </div>

      {/* Claim Territory Section */}
      {selectedShip && !nodeTerritory && (
        <div className="claim-section">
          <h4>Claim This Territory</h4>
          {error && <p className="error-message">⚠️ {error}</p>}
          
          <p className="location">
            📍 {currentNode?.name || 'Unknown'} ({currentNode?.region})
          </p>

          <div className="governance-modes">
            {governanceModes.map(mode => {
              const canSelect = !mode.requiresStr || playerState?.player?.strength >= mode.requiresStr;
              const canSelect2 = !mode.requiresInt || playerState?.player?.intelligence >= mode.requiresInt;
              
              return (
                <div 
                  key={mode.id}
                  className={`mode-card ${governanceMode === mode.id ? 'selected' : ''} ${!canSelect && !canSelect2 ? 'disabled' : ''}`}
                  onClick={() => canSelect || canSelect2 ? setGovernanceMode(mode.id) : null}
                >
                  <div className="mode-icon">{mode.icon}</div>
                  <div className="mode-name">{mode.name}</div>
                  <div className="mode-description">{mode.description}</div>
                  {mode.requiresStr && (
                    <div className={`requirement ${playerState?.player?.strength >= mode.requiresStr ? 'met' : 'unmet'}`}>
                      Str ⚔️ {mode.requiresStr} {playerState?.player?.strength >= mode.requiresStr ? '✓' : '✗'}
                    </div>
                  )}
                  {mode.requiresInt && (
                    <div className={`requirement ${playerState?.player?.intelligence >= mode.requiresInt ? 'met' : 'unmet'}`}>
                      Int 🧠 {mode.requiresInt} {playerState?.player?.intelligence >= mode.requiresInt ? '✓' : '✗'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button 
            className="claim-btn"
            onClick={claimTerritory}
            disabled={loading}
          >
            {loading ? '⏳ Claiming...' : '🏴 Claim Territory'}
          </button>
        </div>
      )}

      {/* Current Territory Info */}
      {nodeTerritory && (
        <div className="current-territory">
          <h4>Current Territory</h4>
          <div className="territory-info">
            <p>
              <strong>Location:</strong> {currentNode?.name}
            </p>
            <p>
              <strong>Governance:</strong> {nodeTerritory.governance_tier}
            </p>
            <p>
              <strong>Claimed:</strong> {new Date(nodeTerritory.claimed_at).toLocaleDateString()}
            </p>
            {nodeTerritory.governance_tier === 'Tyranny' && (
              <div className="tyranny-info">
                <p><strong>Rebellion Meter:</strong> {nodeTerritory.rebellion_meter || 0}%</p>
                <div className="meter-bar">
                  <div className="meter-fill" style={{width: `${nodeTerritory.rebellion_meter || 0}%`}}></div>
                </div>
                {nodeTerritory.rebellion_meter > 80 && (
                  <p className="warning">⚠️ Rebellion risk very high!</p>
                )}
              </div>
            )}
            {nodeTerritory.governance_tier === 'Shadow_Puppet' && (
              <p>🤐 This territory appears unclaimed to other players</p>
            )}
            <div className="revenue">
              <p>💰 Monthly Revenue: {(nodeTerritory.revenue || 0).toLocaleString()} Berries</p>
            </div>
          </div>
        </div>
      )}

      {/* Territories List */}
      <div className="territories-list">
        <h4>Your Territories</h4>
        {territories.length > 0 ? (
          <div className="territories">
            {territories.map(territory => {
              const terNode = gameState?.nodes?.find(n => n.id === territory.node_id);
              return (
                <div 
                  key={territory.id} 
                  className={`territory-item ${selectedTerritory?.id === territory.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTerritory(territory)}
                >
                  <div className="territory-name">
                    {territory.governance_tier === 'Shadow_Puppet' && '👤'}
                    {territory.governance_tier === 'Tyranny' && '👑'}
                    {territory.governance_tier === 'Protection_Flag' && '🏴'}
                    {' '}{terNode?.name}
                  </div>
                  <div className="territory-region">{terNode?.region}</div>
                  <div className="territory-revenue">
                    💰 {(territory.revenue || 0).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p>No territories claimed yet. Claim one to expand your empire!</p>
        )}
      </div>

      {/* Territory Bonuses */}
      <div className="territory-bonuses">
        <h4>Territory Bonuses</h4>
        <div className="bonuses">
          <div className="bonus">
            <span>Total Monthly Revenue:</span>
            <strong>{territories.reduce((sum, t) => sum + (t.revenue || 0), 0).toLocaleString()} Berries</strong>
          </div>
          <div className="bonus">
            <span>Territory Control:</span>
            <strong>{territories.length} regions</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
