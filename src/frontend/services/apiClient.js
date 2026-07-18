/**
 * API Client Utility
 * Centralized HTTP client for all backend communication
 * Handles authentication, error handling, and request/response formatting
 */

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3000';
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:3000';

class APIClient {
  constructor() {
    this.baseURL = API_BASE;
    this.wsURL = WS_URL;
    this.token = null;
    this.playerId = null;
    this.requestTimeout = 30000; // 30 seconds
  }

  /**
   * Initialize client with authentication
   */
  init(playerId, token) {
    this.playerId = playerId;
    this.token = token;
  }

  /**
   * Get authorization headers
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Make HTTP request with error handling
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      timeout: this.requestTimeout,
      ...options,
    };

    try {
      const response = await fetch(url, config);

      // Handle non-JSON responses
      if (!response.headers.get('content-type')?.includes('application/json')) {
        throw new Error(`Server returned non-JSON response: ${response.status}`);
      }

      const data = await response.json();

      // Handle error responses
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  // ========================================================================
  // AUTHENTICATION ENDPOINTS
  // ========================================================================

  async register(username) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
  }

  async login(username) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
  }

  // ========================================================================
  // MAP & STATE ENDPOINTS
  // ========================================================================

  async getMapState() {
    return this.request('/api/map/state');
  }

  async getNodeRoutes(nodeId) {
    return this.request(`/api/map/node/${nodeId}/routes`);
  }

  async getPlayerState(playerId) {
    return this.request(`/api/player/${playerId}`);
  }

  // ========================================================================
  // GAME ACTION ENDPOINTS
  // ========================================================================

  async moveShip(playerId, shipId, targetNodeId) {
    return this.request('/api/game/move', {
      method: 'POST',
      body: JSON.stringify({ playerId, shipId, targetNodeId }),
    });
  }

  async claimTerritory(playerId, shipId, governanceMode) {
    return this.request('/api/game/claim-territory', {
      method: 'POST',
      body: JSON.stringify({ playerId, shipId, governanceTier: governanceMode }),
    });
  }

  // ========================================================================
  // CREW ENDPOINTS
  // ========================================================================

  async getAvailableCrew() {
    return this.request('/api/game/available-crew');
  }

  async recruitCrewMember(playerId, characterId) {
    return this.request('/api/game/recruit-crew', {
      method: 'POST',
      body: JSON.stringify({ playerId, characterId }),
    });
  }

  // ========================================================================
  // COMBAT ENDPOINTS
  // ========================================================================

  async initiateCombat(playerId, targetPlayerId, territory) {
    return this.request('/api/game/combat/initiate', {
      method: 'POST',
      body: JSON.stringify({ playerId, targetPlayerId, territory }),
    });
  }

  async executeCombatAction(combatId, playerId, hakiType, staminaCost) {
    return this.request('/api/game/combat/action', {
      method: 'POST',
      body: JSON.stringify({ combatId, playerId, hakiType, staminaCost }),
    });
  }

  // ========================================================================
  // MESSAGING ENDPOINTS
  // ========================================================================

  async sendMessage(senderId, receiverId, message) {
    return this.request('/api/den-den-mushi/send', {
      method: 'POST',
      body: JSON.stringify({ senderId, receiverId, message }),
    });
  }

  // ========================================================================
  // TERRITORY ENDPOINTS
  // ========================================================================

  async getTerritories() {
    return this.request('/api/game/territories');
  }

  // ========================================================================
  // BOUNTY ENDPOINTS
  // ========================================================================

  async getBountyLeaderboard() {
    return this.request('/api/bounty/leaderboard');
  }

  async applyBountyModifier(playerId, modifierType, value, reason) {
    return this.request('/api/bounty/apply-modifier', {
      method: 'POST',
      body: JSON.stringify({ playerId, modifierType, value, reason }),
    });
  }

  // ========================================================================
  // PONEGLYPH ENDPOINTS
  // ========================================================================

  async getPoneglyphs() {
    return this.request('/api/game/poneglyphs');
  }

  async discoverPoneglyph(playerId, poneglyphId) {
    return this.request('/api/game/poneglyph/discover', {
      method: 'POST',
      body: JSON.stringify({ playerId, poneglyphId }),
    });
  }

  async generateCrew(tier = 1, count = 5) {
    return this.request('/api/character/generate', {
      method: 'POST',
      body: JSON.stringify({ tier, count, playerId: this.playerId }),
    });
  }

  async discoverPoneglyph(playerId) {
    return this.request('/api/poneglyph/discover', {
      method: 'POST',
      body: JSON.stringify({ playerId }),
    });
  }

  async getDiscoveredPoneglyphs(playerId) {
    return this.request(`/api/poneglyph/discovered?playerId=${playerId}`);
  }

  async getAllPoneglyphs(playerId) {
    return this.request(`/api/poneglyph/all?playerId=${playerId}`);
  }

  async createAlliance(allianceName) {
    return this.request('/api/alliance/create', {
      method: 'POST',
      body: JSON.stringify({ playerId: this.playerId, allianceName }),
    });
  }

  async joinAlliance(allianceId) {
    return this.request('/api/alliance/join', {
      method: 'POST',
      body: JSON.stringify({ playerId: this.playerId, allianceId }),
    });
  }

  async getAllAlliances() {
    return this.request('/api/alliance/list');
  }

  async getAllianceMembers(allianceId) {
    return this.request(`/api/alliance/members?allianceId=${allianceId}`);
  }

  async getPlayerAlliance() {
    return this.request(`/api/alliance/player?playerId=${this.playerId}`);
  }

  async declareWar(allianceId1, allianceId2) {
    return this.request('/api/alliance/war/declare', {
      method: 'POST',
      body: JSON.stringify({ allianceId1, allianceId2 }),
    });
  }

  async getAllianceWars(allianceId) {
    return this.request(`/api/alliance/wars?allianceId=${allianceId}`);
  }

  async createVivreCard(targetPlayerId) {
    return this.request('/api/vivrecard/create', {
      method: 'POST',
      body: JSON.stringify({ ownerId: this.playerId, targetPlayerId }),
    });
  }

  async getVivreCards() {
    return this.request(`/api/vivrecard/list?playerId=${this.playerId}`);
  }

  async getBountyLeaderboard(limit = 50) {
    return this.request(`/api/leaderboard/bounty?limit=${limit}`);
  }

  async getPoneglyPHLeaderboard(limit = 50) {
    return this.request(`/api/leaderboard/poneglyphs?limit=${limit}`);
  }

  async getAllianceLeaderboard(limit = 50) {
    return this.request(`/api/leaderboard/alliance?limit=${limit}`);
  }

  async getPlayerStats(playerId) {
    return this.request(`/api/player/stats?playerId=${playerId}`);
  }

  // ========================================================================
  // DAVY BACK FIGHT SYSTEM
  // ========================================================================

  async completeDavyBackFight(playerId, tournamentData) {
    return this.request('/api/game/davy-back-fight/complete', 'POST', {
      playerId,
      games: tournamentData.games,
      totalBounty: tournamentData.totalBounty
    });
  }

  // ========================================================================
  // WEBSOCKET CONNECTION
  // ========================================================================

  connectWebSocket(onMessage, onError) {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `${this.wsURL}/ws/${this.playerId}`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('WebSocket connected');
          resolve(ws);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            onMessage(data);
          } catch (err) {
            console.error('WebSocket message parse error:', err);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          if (onError) onError(error);
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected');
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Send message through WebSocket
   */
  sendWebSocketMessage(ws, data) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  /**
   * Broadcast event through WebSocket
   */
  broadcastEvent(ws, eventData) {
    this.sendWebSocketMessage(ws, {
      type: 'broadcast_event',
      ...eventData,
    });
  }

  /**
   * Update last action through WebSocket
   */
  updateLastAction(ws) {
    this.sendWebSocketMessage(ws, {
      type: 'update_last_action',
    });
  }
}

// Export singleton instance
export const apiClient = new APIClient();
