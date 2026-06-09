import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import './components.css';
import './components-week34.css';
import './components-week2.css';
import { NotificationPanel } from './components/NotificationPanel';
import { NavigationControls } from './components/NavigationControls';
import { CrewRoster } from './components/CrewRoster';
import { CombatUI } from './components/CombatUI';
import { TerritoryGovernance } from './components/TerritoryGovernance';
import { GenerateCrew } from './components/GenerateCrew';
import { PoneglyPHPanel } from './components/PoneglyPHPanel';
import { AlliancePanel } from './components/AlliancePanel';
import { VivreCardPanel } from './components/VivreCardPanel';
import { LeaderboardPanel } from './components/LeaderboardPanel';
import { DavyBackFightUI } from './components/DavyBackFightUI';
import { apiClient } from './api/apiClient';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3000';
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:3000';

export default function GameApp() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [gameState, setGameState] = useState(null);
  const [playerState, setPlayerState] = useState(null);
  const [playerId, setPlayerId] = useState(localStorage.getItem('playerId'));
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [selectedShip, setSelectedShip] = useState(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeCombat, setActiveCombat] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [uiState, setUiState] = useState({
    notificationsOpen: false,
    crewOpen: false,
    territoriesOpen: false
  });
  const websocketRef = useRef(null);
  const shipMarkersRef = useRef({});
  const territoryMarkersRef = useRef({});

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);
    try {
      const result = await apiClient.register(username);
      if (result.success) {
        const data = result.data;
        localStorage.setItem('playerId', data.player_id);
        localStorage.setItem('token', data.token);
        apiClient.init(data.player_id, data.token);
        setPlayerId(data.player_id);
        setToken(data.token);
        setUsername('');
      } else {
        setAuthError(result.error || 'Registration failed');
      }
    } catch (err) {
      console.error('Register error:', err);
      setAuthError('Registration error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);
    try {
      const result = await apiClient.login(username);
      if (result.success) {
        const data = result.data;
        localStorage.setItem('playerId', data.player_id);
        localStorage.setItem('token', data.token);
        apiClient.init(data.player_id, data.token);
        setPlayerId(data.player_id);
        setToken(data.token);
        setUsername('');
      } else {
        setAuthError(result.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setAuthError('Login error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('playerId');
    localStorage.removeItem('token');
    setPlayerId(null);
    setToken(null);
    setPlayerState(null);
    setGameState(null);
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
  };

  // ============================================================================
  // MAP INITIALIZATION
  // ============================================================================

  useEffect(() => {
    if (!mapContainer.current || !playerId) return;

    if (!map.current) {
      map.current = L.map(mapContainer.current, {
        center: [0, 0],
        zoom: 3,
        crs: L.CRS.Simple,
        maxZoom: 8,
        minZoom: 1
      });

      // Add tile layer (could be replaced with One Piece map image)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        noWrap: true
      }).addTo(map.current);
    }

    // Load game state
    fetchMapState();
    fetchPlayerState();

    // Connect WebSocket
    connectWebSocket();

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, [playerId]);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchMapState = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/map/state`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setGameState(data);
      renderMap(data);
    } catch (err) {
      console.error('Failed to fetch map state:', err);
    }
  };

  const fetchPlayerState = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/player/${playerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setPlayerState(data);
    } catch (err) {
      console.error('Failed to fetch player state:', err);
    }
  };

  // ============================================================================
  // MAP RENDERING
  // ============================================================================

  const renderMap = (state) => {
    if (!map.current) return;

    // Clear existing markers
    Object.values(shipMarkersRef.current).forEach(marker => marker.remove());
    Object.values(territoryMarkersRef.current).forEach(marker => marker.remove());
    shipMarkersRef.current = {};
    territoryMarkersRef.current = {};

    // Render nodes
    if (state.nodes && state.nodes.length > 0) {
      state.nodes.forEach(node => {
        const marker = L.circleMarker([node.x || 0, node.y || 0], {
          radius: 8,
          fillColor: '#1e90ff',
          color: '#000',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        })
          .bindPopup(`<b>${node.name}</b><br>Region: ${node.region}`)
          .addTo(map.current);
      });
    }

    // Render edges
    if (state.edges && state.edges.length > 0) {
      state.edges.forEach(edge => {
        const fromNode = state.nodes?.find(n => n.id === edge.from_node_id);
        const toNode = state.nodes?.find(n => n.id === edge.to_node_id);
        if (fromNode && toNode) {
          L.polyline([[fromNode.x || 0, fromNode.y || 0], [toNode.x || 0, toNode.y || 0]], {
            color: '#888',
            weight: 1,
            opacity: 0.5
          }).addTo(map.current);
        }
      });
    }

    // Render ships
    if (state.ships && state.ships.length > 0) {
      state.ships.forEach(ship => {
        const node = state.nodes?.find(n => n.id === ship.node_id);
        if (node) {
          const color = ship.player_id === playerId ? '#ff6347' : '#ffa500';
          const marker = L.circleMarker([node.x || 0, node.y || 0], {
            radius: 6,
            fillColor: color,
            color: '#000',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.9
          })
            .bindPopup(`Ship ${ship.id.substring(0, 8)}<br>Hull: ${ship.hull_integrity || 100}%`)
            .addTo(map.current);

          shipMarkersRef.current[ship.id] = marker;
        }
      });
    }

    // Render territories
    if (state.territories && state.territories.length > 0) {
      state.territories.forEach(territory => {
        const node = state.nodes?.find(n => n.id === territory.node_id);
        if (node) {
          const marker = L.circleMarker([node.x || 0, node.y || 0], {
            radius: 10,
            fillColor: 'rgba(255, 165, 0, 0.3)',
            color: '#ff8c00',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.3,
            dashArray: '5, 5'
          })
            .bindPopup(`Territory<br>Owner: ${territory.owner_id.substring(0, 8)}<br>Mode: ${territory.governance_tier}`)
            .addTo(map.current);

          territoryMarkersRef.current[territory.id] = marker;
        }
      });
    }
  };

  // ============================================================================
  // WEBSOCKET
  // ============================================================================

  const connectWebSocket = () => {
    if (!playerId) return;

    websocketRef.current = new WebSocket(`${WS_URL}/ws/${playerId}`);

    websocketRef.current.onopen = () => {
      console.log('WebSocket connected');
      websocketRef.current.send(JSON.stringify({ type: 'update_last_action' }));
    };

    websocketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'broadcast_event') {
        fetchMapState();
        fetchPlayerState();
      }

      if (data.type === 'den_den_mushi_message') {
        alert(`Message from ${data.from}: ${data.message}`);
      }
    };

    websocketRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocketRef.current.onclose = () => {
      console.log('WebSocket disconnected');
      setTimeout(connectWebSocket, 3000);
    };
  };

  // ============================================================================
  // GAME ACTIONS
  // ============================================================================

  const moveShip = async (shipId, targetNodeId) => {
    try {
      const res = await fetch(`${API_BASE}/api/game/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ playerId, shipId, targetNodeId })
      });

      if (res.ok) {
        fetchMapState();
        fetchPlayerState();
        alert('Ship moved!');
      } else {
        alert('Move failed');
      }
    } catch (err) {
      console.error('Move error:', err);
      alert('Error moving ship');
    }
  };

  const claimTerritory = async (shipId) => {
    try {
      const res = await fetch(`${API_BASE}/api/game/claim-territory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ playerId, shipId, governanceTier: 'Protection_Flag' })
      });

      if (res.ok) {
        fetchMapState();
        fetchPlayerState();
        alert('Territory claimed!');
      } else {
        alert('Claim failed');
      }
    } catch (err) {
      console.error('Claim error:', err);
      alert('Error claiming territory');
    }
  };

  const recruitCrew = async (characterId) => {
    try {
      const res = await fetch(`${API_BASE}/api/game/recruit-crew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ playerId, characterId })
      });

      if (res.ok) {
        fetchPlayerState();
        alert('Crew member recruited!');
      } else {
        const data = await res.json();
        alert(`Recruitment failed: ${data.error}`);
      }
    } catch (err) {
      console.error('Recruitment error:', err);
      alert('Error recruiting crew');
    }
  };

  // ============================================================================
  // AUTH SCREEN
  // ============================================================================

  if (!playerId) {
    return (
      <div className="auth-container">
        <div className="auth-panel">
          <h1>🏴‍☠️ One Piece Game</h1>
          <form onSubmit={handleRegister}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={loading}>Register</button>
          </form>
          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={loading}>Login</button>
          </form>
        </div>
      </div>
    );
  }

  // ============================================================================
  // GAME SCREEN
  // ============================================================================

  return (
    <div className="game-container">
      {/* Header */}
      <div className="game-header">
        <div className="header-left">
          <h1>🏴‍☠️ One Piece Game</h1>
        </div>
        <div className="header-center">
          {playerState?.player && (
            <>
              <div className="header-stat">
                <span className="label">Bounty:</span>
                <span className="value">{playerState.player.total_bounty?.toLocaleString() || 0} Berries</span>
              </div>
              <div className="header-stat">
                <span className="label">Title:</span>
                <span className="value">{playerState.player.title || 'Pirate'}</span>
              </div>
            </>
          )}
        </div>
        <div className="header-right">
          <button className="logout-btn" onClick={() => {
            localStorage.clear();
            setPlayerId(null);
            setToken(null);
          }}>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="game-content">
        {/* Left Sidebar */}
        <div className="sidebar-left">
          <div className="player-panel">
            <h3>👤 Player Stats</h3>
            {playerState?.player && (
              <>
                <p><strong>ID:</strong> {playerState.player.id.substring(0, 8)}</p>
                <p><strong>Strength:</strong> {playerState.player.strength || 100}</p>
                <p><strong>Intelligence:</strong> {playerState.player.intelligence || 100}</p>
                <p><strong>Willpower:</strong> {playerState.player.willpower || 100}</p>
                <p><strong>Stamina:</strong> {playerState.player.stamina || 100}</p>
                <div className="stat-summary">
                  <span>🚢 Ships: {playerState.ships?.length || 0}</span>
                  <span>👥 Crew: {playerState.crew?.length || 0}</span>
                  <span>🏰 Territories: {playerState.territories?.length || 0}</span>
                </div>
              </>
            )}
          </div>

          <div className="ships-panel">
            <h3>🚢 Your Ships</h3>
            {playerState?.ships?.map(ship => (
              <div
                key={ship.id}
                className={`ship-item ${selectedShip?.id === ship.id ? 'selected' : ''}`}
                onClick={() => setSelectedShip(ship)}
              >
                <div className="ship-name">Ship {ship.id.substring(0, 8)}</div>
                <div className="ship-health">
                  <div className="health-bar">
                    <div
                      className="health-fill"
                      style={{ width: `${Math.max(0, (ship.hull || 1000) / 10)}%` }}
                    ></div>
                  </div>
                  <span>{ship.hull || 1000}/1000</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center Map */}
        <div className="map-panel" ref={mapContainer}></div>

        {/* Right Sidebar */}
        <div className="sidebar-right">
          <NavigationControls
            selectedShip={selectedShip}
            gameState={gameState}
            playerState={playerState}
            onMove={moveShip}
            apiBase={API_BASE}
            token={token}
          />

          <TerritoryGovernance
            playerState={playerState}
            gameState={gameState}
            playerId={playerId}
            selectedShip={selectedShip}
            apiBase={API_BASE}
            token={token}
            onTerritoryUpdate={fetchMapState}
          />
        </div>
      </div>

      {/* Bottom Panel */}
      <div className="bottom-panel">
        <NotificationPanel
          playerId={playerId}
          token={token}
          websocketRef={websocketRef}
          apiBase={API_BASE}
        />

        <GenerateCrew
          playerId={playerId}
          token={token}
          onCrewUpdated={() => {
            fetchPlayerState();
            fetchMapState();
          }}
        />

        <CrewRoster
          playerState={playerState}
          playerId={playerId}
          apiBase={API_BASE}
          token={token}
          onRecruitSuccess={() => {
            fetchPlayerState();
            fetchMapState();
          }}
        />

        <PoneglyPHPanel
          playerId={playerId}
          token={token}
        />

        <AlliancePanel
          playerId={playerId}
          token={token}
        />

        <VivreCardPanel
          playerId={playerId}
          token={token}
        />

        <LeaderboardPanel
          playerId={playerId}
          token={token}
        />

        <DavyBackFightUI
          playerId={playerId}
          token={token}
          onTournamentEnd={() => {
            fetchPlayerState();
            fetchMapState();
          }}
        />
      </div>

      {/* Combat Modal */}
      {activeCombat && (
        <CombatUI
          playerState={playerState}
          playerId={playerId}
          activeCombat={activeCombat}
          apiBase={API_BASE}
          token={token}
          onCombatEnd={() => {
            setActiveCombat(null);
            fetchMapState();
            fetchPlayerState();
          }}
        />
      )}
    </div>
  );
}

