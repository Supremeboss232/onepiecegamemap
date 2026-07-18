import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';

export function NavigationControls({ 
  selectedShip, 
  gameState, 
  playerState,
  playerId,
  onMove, 
  apiBase, 
  token 
}) {
  const [availableRoutes, setAvailableRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [movingShipId, setMovingShipId] = useState(null);
  const [navigationMode, setNavigationMode] = useState('forced'); // forced or liberated
  const [error, setError] = useState(null);

  useEffect(() => {
    if (selectedShip && gameState?.nodes) {
      fetchAvailableRoutes();
    }
  }, [selectedShip, gameState]);

  const fetchAvailableRoutes = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.getNodeRoutes(selectedShip.node_id);
      
      if (!result.success) {
        setError(result.error);
        return;
      }

      // Determine navigation mode based on navigator stat
      const navigatorStat = playerState?.player?.navigator_stat || 0;
      setNavigationMode(navigatorStat >= 80 ? 'liberated' : 'forced');

      setAvailableRoutes(result.data.edges || result.data || []);
    } catch (err) {
      console.error('Failed to fetch routes:', err);
      setError('Failed to fetch available routes');
    } finally {
      setLoading(false);
    }
  };

  const handleMove = async (targetNodeId) => {
    if (!selectedShip || !playerId) return;

    try {
      setMovingShipId(selectedShip.id);
      setError(null);

      const result = await apiClient.moveShip(playerId, selectedShip.id, targetNodeId);

      if (!result.success) {
        setError(result.error);
        return;
      }

      // Notify parent component
      if (onMove) {
        onMove(selectedShip.id, targetNodeId, result.data);
      }

      // Refresh routes after move
      fetchAvailableRoutes();
    } catch (err) {
      console.error('Move failed:', err);
      setError('Failed to move ship');
    } finally {
      setMovingShipId(null);
    }
  };

  if (!selectedShip) {
    return (
      <div className="navigation-controls disabled">
        <p>Select a ship to navigate</p>
      </div>
    );
  }

  const currentNode = gameState?.nodes?.find(n => n.id === selectedShip.node_id);
  
  return (
    <div className="navigation-controls">
      <div className="nav-header">
        <h3>🧭 Navigation</h3>
        <div className="nav-mode">
          <span className={`mode-badge ${navigationMode}`}>
            {navigationMode === 'forced' ? '⛓️ Forced Forward' : '🗺️ Liberated'}
          </span>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <p>⚠️ {error}</p>
        </div>
      )}

      <div className="current-position">
        <p><strong>Current:</strong> {currentNode?.name || 'Unknown'}</p>
        <p><strong>Region:</strong> {currentNode?.region || 'N/A'}</p>
        <p><strong>Hull:</strong> {selectedShip.hull || 1000}/1000</p>
      </div>

      <div className="routes-list">
        <h4>Available Routes</h4>
        {loading ? (
          <p className="loading-text">⏳ Loading routes...</p>
        ) : availableRoutes.length > 0 ? (
          availableRoutes.map((route, idx) => {
            const targetNodeId = route.from_node_id === selectedShip.node_id 
              ? route.to_node_id 
              : route.from_node_id;
            const targetNode = gameState?.nodes?.find(n => n.id === targetNodeId);

            return (
              <div key={idx} className="route-item">
                <div className="route-info">
                  <div className="route-name">{targetNode?.name}</div>
                  <div className="route-details">
                    <span className="distance">📏 {route.distance} days</span>
                    <span className={`hazard hazard-${route.hazard_level}`}>
                      ⚠️ Level {route.hazard_level}
                    </span>
                    {route.requires_log_pose && (
                      <span className="requirement">📍 Log Pose Required</span>
                    )}
                  </div>
                </div>
                <button 
                  className="move-btn"
                  onClick={() => handleMove(targetNodeId)}
                  disabled={loading || movingShipId === selectedShip.id}
                >
                  {movingShipId === selectedShip.id ? '⏳ Moving...' : 'Move'}
                </button>
              </div>
            );
          })
        ) : (
          <p className="no-routes">No available routes</p>
        )}
      </div>

      <div className="navigation-info">
        <p>
          <strong>Mode:</strong> {navigationMode === 'forced' 
            ? 'Navigate sequentially forward only (Navigator stat < 80)'
            : 'Navigate freely between connected nodes (Navigator stat ≥ 80)'}
        </p>
        <p><strong>Navigator Stat:</strong> {playerState?.player?.navigator_stat || 0}</p>
      </div>
    </div>
  );
}
