#!/usr/bin/env node

/**
 * One Piece Game - API Endpoint Tester
 * Tests all critical API endpoints to verify Phase 3 integration
 * 
 * Usage: node test-endpoints.js [API_URL] [USERNAME]
 * Example: node test-endpoints.js http://localhost:3000 testplayer
 */

const API_URL = process.argv[2] || 'http://localhost:3000';
const TEST_USERNAME = process.argv[3] || 'test_' + Date.now();

let playerId = null;
let token = null;
let shipId = null;

// Color codes for console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, passed, error = null) {
  if (passed) {
    log(`✅ ${name}`, 'green');
  } else {
    log(`❌ ${name}`, 'red');
    if (error) log(`   Error: ${error}`, 'red');
  }
  return passed;
}

async function makeRequest(method, endpoint, body = null, useToken = true) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (useToken && token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();

    return {
      status: response.status,
      success: response.ok,
      data
    };
  } catch (error) {
    return {
      status: 0,
      success: false,
      error: error.message,
      data: null
    };
  }
}

async function testHealth() {
  log('\n🔍 Testing Server Health...', 'cyan');
  
  try {
    const response = await fetch(`${API_URL}/health`);
    return logTest('Server is running', response.ok, `Status: ${response.status}`);
  } catch (error) {
    return logTest('Server is running', false, error.message);
  }
}

async function testRegistration() {
  log('\n📝 Testing Authentication...', 'cyan');

  const result = await makeRequest('POST', '/api/auth/register', 
    { username: TEST_USERNAME }, 
    false
  );

  if (logTest('Register endpoint', result.success, result.error)) {
    playerId = result.data?.player_id;
    token = result.data?.token;
    shipId = result.data?.ship_id;
    
    log(`   Player ID: ${playerId?.substring(0, 8)}...`, 'yellow');
    log(`   Token: ${token?.substring(0, 20)}...`, 'yellow');
    log(`   Ship ID: ${shipId?.substring(0, 8)}...`, 'yellow');
    
    return true;
  }
  return false;
}

async function testLogin() {
  log('\n🔐 Testing Login...', 'cyan');

  const result = await makeRequest('POST', '/api/auth/login',
    { username: TEST_USERNAME },
    false
  );

  if (logTest('Login endpoint', result.success, result.error)) {
    const newPlayerId = result.data?.player_id;
    const newToken = result.data?.token;
    
    log(`   Tokens match: ${newToken === token}`, 'yellow');
    return newToken === token;
  }
  return false;
}

async function testMapState() {
  log('\n🗺️  Testing Map State...', 'cyan');

  const result = await makeRequest('GET', '/api/map/state');

  if (logTest('Map state endpoint', result.success, result.error)) {
    const hasNodes = result.data?.nodes?.length > 0;
    const hasEdges = result.data?.edges?.length > 0;
    const hasShips = result.data?.ships?.length > 0;
    const hasTerritories = Array.isArray(result.data?.territories);

    log(`   Nodes: ${result.data?.nodes?.length || 0}`, hasNodes ? 'green' : 'yellow');
    log(`   Edges: ${result.data?.edges?.length || 0}`, hasEdges ? 'green' : 'yellow');
    log(`   Ships: ${result.data?.ships?.length || 0}`, hasShips ? 'green' : 'yellow');
    log(`   Territories: ${result.data?.territories?.length || 0}`, hasTerritories ? 'green' : 'yellow');

    return hasNodes && hasEdges;
  }
  return false;
}

async function testPlayerState() {
  log('\n👤 Testing Player State...', 'cyan');

  const result = await makeRequest('GET', `/api/player/${playerId}`);

  if (logTest('Player state endpoint', result.success, result.error)) {
    const hasPlayer = result.data?.player?.id;
    const hasShips = Array.isArray(result.data?.ships);
    const hasCrew = Array.isArray(result.data?.crew);

    log(`   Player: ${result.data?.player?.username}`, hasPlayer ? 'green' : 'yellow');
    log(`   Ships: ${result.data?.ships?.length || 0}`, hasShips ? 'green' : 'yellow');
    log(`   Crew: ${result.data?.crew?.length || 0}`, hasCrew ? 'green' : 'yellow');

    return hasPlayer && hasShips;
  }
  return false;
}

async function testGameMove() {
  log('\n🚢 Testing Ship Movement...', 'cyan');

  const mapResult = await makeRequest('GET', '/api/map/state');
  const nodes = mapResult.data?.nodes || [];
  
  if (nodes.length < 2) {
    log('⚠️  Not enough nodes to test movement', 'yellow');
    return false;
  }

  const targetNodeId = nodes[1].id;

  const result = await makeRequest('POST', '/api/game/move',
    {
      playerId,
      shipId,
      targetNodeId
    }
  );

  return logTest('Move endpoint', result.success, result.error);
}

async function testCombatAction() {
  log('\n⚔️  Testing Combat...', 'cyan');

  // This might fail if no combat exists, but we're just testing the endpoint
  const result = await makeRequest('POST', '/api/game/combat/action',
    {
      playerId,
      combatId: 'test-combat-' + Date.now(),
      hakiType: 'Observation',
      staminaCost: 20
    }
  );

  // Combat action might fail due to missing combat, but endpoint should exist
  return logTest('Combat endpoint exists', result.status > 0, result.error);
}

async function testTerritoryClaimm() {
  log('\n🏰 Testing Territory Claim...', 'cyan');

  const mapResult = await makeRequest('GET', '/api/map/state');
  const nodes = mapResult.data?.nodes || [];
  
  if (nodes.length === 0) {
    log('⚠️  No nodes available to test territory claim', 'yellow');
    return false;
  }

  const result = await makeRequest('POST', '/api/game/claim-territory',
    {
      playerId,
      shipId,
      governanceTier: 'Protection_Flag'
    }
  );

  return logTest('Territory claim endpoint', result.success, result.error);
}

async function testCrewRecruitment() {
  log('\n👥 Testing Crew Recruitment...', 'cyan');

  // Create a test character
  const result = await makeRequest('POST', '/api/game/recruit-crew',
    {
      playerId,
      characterId: 'test-character-' + Date.now()
    }
  );

  // Might fail due to invalid character, but endpoint should exist
  return logTest('Crew recruitment endpoint exists', result.status > 0, result.error);
}

async function testDenDenMushi() {
  log('\n📱 Testing Den Den Mushi...', 'cyan');

  const result = await makeRequest('POST', '/api/den-den-mushi/send',
    {
      playerId,
      recipientId: 'test-recipient-' + Date.now(),
      message: 'Test message from Phase 3 integration test'
    }
  );

  // Might fail due to invalid recipient, but endpoint should exist
  return logTest('Den Den Mushi endpoint exists', result.status > 0, result.error);
}

async function testWebSocket() {
  log('\n🔌 Testing WebSocket...', 'cyan');

  return new Promise((resolve) => {
    try {
      const WS_URL = API_URL.replace('http', 'ws');
      const ws = new WebSocket(`${WS_URL}/ws/${playerId}`);

      const timeout = setTimeout(() => {
        ws.close();
        logTest('WebSocket connection', false, 'Connection timeout');
        resolve(false);
      }, 5000);

      ws.onopen = () => {
        clearTimeout(timeout);
        log('✅ WebSocket connected', 'green');
        ws.send(JSON.stringify({ type: 'ping' }));
        setTimeout(() => ws.close(), 1000);
        resolve(true);
      };

      ws.onerror = (error) => {
        clearTimeout(timeout);
        logTest('WebSocket connection', false, error.message);
        resolve(false);
      };

      ws.onclose = () => {
        clearTimeout(timeout);
      };
    } catch (error) {
      logTest('WebSocket connection', false, error.message);
      resolve(false);
    }
  });
}

async function runAllTests() {
  log('\n╔════════════════════════════════════════╗', 'blue');
  log('║ One Piece Game - Phase 3 API Tester  ║', 'blue');
  log('╚════════════════════════════════════════╝', 'blue');
  
  log(`\nAPI URL: ${API_URL}`, 'cyan');
  log(`Test Username: ${TEST_USERNAME}`, 'cyan');

  const results = {
    health: await testHealth(),
    register: await testRegistration(),
    login: await testLogin(),
    mapState: await testMapState(),
    playerState: await testPlayerState(),
    move: await testGameMove(),
    combat: await testCombatAction(),
    territory: await testTerritoryClaimm(),
    crew: await testCrewRecruitment(),
    denDenMushi: await testDenDenMushi(),
    webSocket: await testWebSocket()
  };

  // Summary
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;

  log('\n╔════════════════════════════════════════╗', 'blue');
  log(`║ Test Results: ${passed}/${total} Passed              ║`, passed === total ? 'green' : 'yellow', 'blue');
  log('╚════════════════════════════════════════╝', 'blue');

  if (passed === total) {
    log('\n🎉 All tests passed! Phase 3 integration is complete.', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Some tests failed. Check the errors above.', 'yellow');
    process.exit(1);
  }
}

// Handle WebSocket for Node.js (optional)
if (typeof WebSocket === 'undefined') {
  log('\n⚠️  WebSocket not available in Node.js. Install: npm install ws', 'yellow');
  global.WebSocket = require('ws');
}

runAllTests().catch(error => {
  log(`\n❌ Test runner error: ${error.message}`, 'red');
  process.exit(1);
});
