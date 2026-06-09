import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyWebsocket from '@fastify/websocket';
import fastifyCors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { supabaseAdmin } from './supabaseAdmin.js';
import { GameEngine } from './gameLogic.js';
import CharacterGenerator from './characterGenerator.js';
import PoneglyPHSystem from './poneglyphSystem.js';
import AllianceSystem from './allianceSystem.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fastify = Fastify({ logger: true });
const gameEngine = new GameEngine();
const activeSockets = new Map();

// Register plugins
await fastify.register(fastifyJwt, { secret: process.env.JWT_SECRET || 'dev-secret-key' });
await fastify.register(fastifyWebsocket);
await fastify.register(fastifyCors, { 
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true 
});
await fastify.register(fastifyStatic, { root: path.join(__dirname, '../other') });

// ============================================================================
// HEALTH CHECK
// ============================================================================

fastify.get('/api/health', async (request, reply) => {
  return reply.send({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================

fastify.post('/api/auth/register', async (request, reply) => {
  const { username } = request.body;

  try {
    const { data: player, error } = await supabaseAdmin
      .from('players')
      .insert([{ 
        username, 
        bounty: 0, 
        total_bounty: 0,
        willpower: 100,
        intelligence: 100,
        strength: 100,
        stamina: 100,
        created_at: new Date().toISOString(),
        last_action: new Date().toISOString()
      }])
      .select();

    if (error || !player || !player[0]) {
      return reply.status(400).send({ error: 'Failed to register player' });
    }

    // Create starter ship for new player at starting island (East Blue - node 1)
    const { data: ship, error: shipError } = await supabaseAdmin
      .from('ships')
      .insert([{
        player_id: player[0].id,
        node_id: 1, // Default starting island
        hull: 1000,
        last_moved_at: new Date().toISOString()
      }])
      .select();

    if (shipError || !ship) {
      fastify.log.error('Ship creation failed:', shipError);
      return reply.status(400).send({ error: 'Failed to create starter ship' });
    }

    const token = fastify.jwt.sign({ player_id: player[0].id, username });
    return reply.send({ player_id: player[0].id, username, token, ship_id: ship[0].id });
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Server error' });
  }
});

fastify.post('/api/auth/login', async (request, reply) => {
  const { username } = request.body;

  try {
    const { data: players, error } = await supabaseAdmin
      .from('players')
      .select('id, username')
      .eq('username', username)
      .limit(1);

    if (error || !players || players.length === 0) {
      return reply.status(401).send({ error: 'Player not found' });
    }

    const player = players[0];
    const token = fastify.jwt.sign({ player_id: player.id, username: player.username });
    
    // Update last action
    await supabaseAdmin
      .from('players')
      .update({ last_action: new Date().toISOString() })
      .eq('id', player.id);

    return reply.send({ player_id: player.id, token });
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Server error' });
  }
});

// ============================================================================
// MAP & GAME STATE ROUTES
// ============================================================================

fastify.get('/api/map/state', async (request, reply) => {
  try {
    const mapState = await gameEngine.getMapState();
    return reply.send(mapState);
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Failed to fetch map state' });
  }
});

fastify.get('/api/map/node/:id/routes', async (request, reply) => {
  const { id } = request.params;

  try {
    const routes = await gameEngine.getAvailableRoutes(id);
    return reply.send({ node_id: id, routes });
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Failed to fetch routes' });
  }
});

fastify.get('/api/player/:id', async (request, reply) => {
  const { id } = request.params;

  try {
    const playerState = await gameEngine.getPlayerState(id);
    return reply.send(playerState);
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Failed to fetch player data' });
  }
});

// ============================================================================
// MOVEMENT & GAME ACTIONS
// ============================================================================

fastify.post('/api/game/move', async (request, reply) => {
  const { playerId, shipId, targetNodeId } = request.body;

  try {
    const result = await gameEngine.moveShip(playerId, shipId, targetNodeId);
    return reply.send(result);
  } catch (err) {
    fastify.log.error(err);
    return reply.status(400).send({ error: err.message });
  }
});

fastify.post('/api/game/claim-territory', async (request, reply) => {
  const { playerId, shipId, governanceTier } = request.body;

  try {
    const result = await gameEngine.claimTerritory(playerId, shipId, governanceTier);
    return reply.send(result);
  } catch (err) {
    fastify.log.error(err);
    return reply.status(400).send({ error: err.message });
  }
});

// ============================================================================
// CREW MANAGEMENT
// ============================================================================

fastify.post('/api/game/recruit-crew', async (request, reply) => {
  const { playerId, characterId } = request.body;

  try {
    const result = await gameEngine.recruitCrewMember(playerId, characterId);
    return reply.send(result);
  } catch (err) {
    fastify.log.error(err);
    return reply.status(400).send({ error: err.message });
  }
});

fastify.get('/api/game/available-crew', async (request, reply) => {
  try {
    const { data: crew, error } = await supabaseAdmin
      .from('global_characters')
      .select('*')
      .eq('current_status', 'Free_Agent');

    if (error) {
      return reply.status(500).send({ error: 'Failed to fetch crew' });
    }

    return reply.send({ available_crew: crew || [] });
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Server error' });
  }
});

// ============================================================================
// COMBAT SYSTEM
// ============================================================================

fastify.post('/api/game/combat/initiate', async (request, reply) => {
  const { attackerId, defenderId } = request.body;

  try {
    const { data: combat, error } = await supabaseAdmin
      .from('combat_sessions')
      .insert([{
        attacker_id: attackerId,
        defender_id: defenderId,
        status: 'active',
        started_at: new Date().toISOString()
      }])
      .select();

    if (error || !combat || combat.length === 0) {
      return reply.status(500).send({ error: 'Failed to initiate combat' });
    }

    return reply.send({ combat_id: combat[0].id, status: 'active' });
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Server error' });
  }
});

fastify.post('/api/game/combat/action', async (request, reply) => {
  const { combatId, playerId, hakiType, staminaCost } = request.body;

  try {
    const result = await gameEngine.processCombatAction(combatId, playerId, hakiType, staminaCost);
    return reply.send(result);
  } catch (err) {
    fastify.log.error(err);
    return reply.status(400).send({ error: err.message });
  }
});

// ============================================================================
// BOUNTY SYSTEM
// ============================================================================

fastify.get('/api/bounty/leaderboard', async (request, reply) => {
  try {
    const { data: players, error } = await supabaseAdmin
      .from('players')
      .select('id, username, total_bounty, title')
      .order('total_bounty', { ascending: false })
      .limit(50);

    if (error) {
      return reply.status(500).send({ error: 'Failed to fetch leaderboard' });
    }

    return reply.send({ leaderboard: players || [] });
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Server error' });
  }
});

fastify.post('/api/bounty/apply-modifier', async (request, reply) => {
  const { playerId, modifierType, modifierValue, reason } = request.body;

  try {
    const result = await gameEngine.applyBountyModifier(playerId, modifierType, modifierValue, reason);
    return reply.send(result);
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Server error' });
  }
});

// ============================================================================
// PONEGLYPH SYSTEM
// ============================================================================

fastify.post('/api/game/poneglyph/discover', async (request, reply) => {
  const { playerId, poneglyphId } = request.body;

  try {
    const result = await gameEngine.discoverPoneglyph(playerId, poneglyphId);
    return reply.send(result);
  } catch (err) {
    fastify.log.error(err);
    return reply.status(400).send({ error: err.message });
  }
});

fastify.get('/api/game/poneglyphs', async (request, reply) => {
  try {
    const { data: poneglyphs, error } = await supabaseAdmin
      .from('poneglyphs')
      .select('*');

    if (error) {
      return reply.status(500).send({ error: 'Failed to fetch poneglyphs' });
    }

    return reply.send({ poneglyphs: poneglyphs || [] });
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Server error' });
  }
});

// ============================================================================
// DEN DEN MUSHI COMMUNICATION
// ============================================================================

fastify.post('/api/den-den-mushi/send', async (request, reply) => {
  const { senderId, receiverId, message } = request.body;

  try {
    const { error } = await supabaseAdmin
      .from('den_den_mushi_channels')
      .insert([{ 
        sender_id: senderId, 
        receiver_id: receiverId, 
        message, 
        created_at: new Date().toISOString() 
      }]);

    if (error) {
      return reply.status(500).send({ error: 'Failed to send message' });
    }

    // Broadcast to receiver if online
    const receiverSocket = activeSockets.get(receiverId);
    if (receiverSocket && receiverSocket.socket.readyState === 1) {
      receiverSocket.socket.send(JSON.stringify({
        type: 'den_den_mushi_message',
        from: senderId,
        message
      }));
    }

    return reply.send({ success: true, message_sent: true });
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Server error' });
  }
});

// ============================================================================
// CHARACTER GENERATION
// ============================================================================

fastify.post('/api/character/generate', async (request, reply) => {
  const { tier = 1, count = 5, playerId } = request.body;

  try {
    // Validate input
    if (!playerId) {
      return reply.status(400).send({ error: 'Missing playerId' });
    }
    if (![1, 2, 3].includes(tier)) {
      return reply.status(400).send({ error: 'Invalid tier (must be 1, 2, or 3)' });
    }
    if (count < 1 || count > 20) {
      return reply.status(400).send({ error: 'Count must be between 1 and 20' });
    }

    // Generate crew
    const crew = CharacterGenerator.generateCrew(count, tier);

    // Validate all characters
    for (const char of crew) {
      const validation = CharacterGenerator.validateCharacter(char);
      if (!validation.valid) {
        fastify.log.error('Character validation failed:', validation.errors);
        return reply.status(500).send({ error: 'Character generation validation failed' });
      }
    }

    // Optionally store in database for future recruitment
    // For now, just return generated crew
    return reply.send({ success: true, crew });
  } catch (err) {
    fastify.log.error('Character generation error:', err);
    return reply.status(500).send({ error: 'Failed to generate crew' });
  }
});

// ============================================================================
// TERRITORIES & GOVERNANCE
// ============================================================================

fastify.get('/api/game/territories', async (request, reply) => {
  try {
    const { data: territories, error } = await supabaseAdmin
      .from('territories')
      .select('*');

    if (error) {
      return reply.status(500).send({ error: 'Failed to fetch territories' });
    }

    return reply.send({ territories: territories || [] });
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Server error' });
  }
});

// ============================================================================
// ALLIANCES
// ============================================================================

fastify.post('/api/game/alliance/form', async (request, reply) => {
  const { crew1Id, crew2Id, allianceType } = request.body;

  try {
    const { error } = await supabaseAdmin
      .from('alliances')
      .insert([{ crew_1_id: crew1Id, crew_2_id: crew2Id, alliance_type: allianceType }]);

    if (error) {
      return reply.status(500).send({ error: 'Failed to form alliance' });
    }

    return reply.send({ success: true, alliance_formed: true });
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Server error' });
  }
});

// ============================================================================
// EVENTS
// ============================================================================

fastify.get('/api/game/events', async (request, reply) => {
  try {
    const { data: events, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return reply.status(500).send({ error: 'Failed to fetch events' });
    }

    return reply.send(events || []);
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Server error' });
  }
});

// ============================================================================
// WEBSOCKET REAL-TIME UPDATES
// ============================================================================

fastify.get('/ws/:playerId', { websocket: true }, (socket, request) => {
  const { playerId } = request.params;

  activeSockets.set(playerId, { socket, connectedAt: Date.now() });
  fastify.log.info(`Player ${playerId} connected via WebSocket`);

  socket.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === 'update_last_action') {
        await supabaseAdmin
          .from('players')
          .update({ last_action: new Date().toISOString() })
          .eq('id', playerId);
      }

      if (data.type === 'broadcast_event') {
        activeSockets.forEach((client) => {
          if (client.socket.readyState === 1) {
            client.socket.send(JSON.stringify(data));
          }
        });
      }
    } catch (err) {
      fastify.log.error(`WebSocket error for ${playerId}:`, err);
    }
  });

  socket.on('close', () => {
    activeSockets.delete(playerId);
    fastify.log.info(`Player ${playerId} disconnected`);
  });
});

// ============================================================================
// PONEGLYPH DISCOVERY SYSTEM
// ============================================================================

fastify.post('/api/poneglyph/discover', async (request, reply) => {
  const { playerId } = request.body;

  try {
    const result = await PoneglyPHSystem.discoverPoneglyph(supabaseAdmin, playerId);
    return reply.send(result);
  } catch (err) {
    fastify.log.error('Poneglyph discovery error:', err);
    return reply.status(500).send({ error: 'Failed to discover poneglyph' });
  }
});

fastify.get('/api/poneglyph/discovered', async (request, reply) => {
  const { playerId } = request.query;

  try {
    const result = await PoneglyPHSystem.getDiscoveredPoneglyphs(supabaseAdmin, playerId);
    return reply.send(result);
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Failed to fetch poneglyphs' });
  }
});

fastify.get('/api/poneglyph/all', async (request, reply) => {
  const { playerId } = request.query;

  try {
    const result = await PoneglyPHSystem.getAllPoneglyPHs(supabaseAdmin, playerId);
    return reply.send(result);
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Failed to fetch poneglyphs' });
  }
});

// ============================================================================
// ALLIANCE SYSTEM
// ============================================================================

fastify.post('/api/alliance/create', async (request, reply) => {
  const { playerId, allianceName } = request.body;

  try {
    const result = await AllianceSystem.createAlliance(supabaseAdmin, playerId, allianceName);
    return reply.send(result);
  } catch (err) {
    fastify.log.error('Alliance creation error:', err);
    return reply.status(500).send({ error: 'Failed to create alliance' });
  }
});

fastify.post('/api/alliance/join', async (request, reply) => {
  const { playerId, allianceId } = request.body;

  try {
    const result = await AllianceSystem.joinAlliance(supabaseAdmin, playerId, allianceId);
    return reply.send(result);
  } catch (err) {
    fastify.log.error('Join alliance error:', err);
    return reply.status(500).send({ error: 'Failed to join alliance' });
  }
});

fastify.get('/api/alliance/list', async (request, reply) => {
  try {
    const result = await AllianceSystem.getAllAlliances(supabaseAdmin);
    return reply.send(result);
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Failed to fetch alliances' });
  }
});

fastify.get('/api/alliance/members', async (request, reply) => {
  const { allianceId } = request.query;

  try {
    const result = await AllianceSystem.getAllianceMembers(supabaseAdmin, allianceId);
    return reply.send(result);
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Failed to fetch members' });
  }
});

fastify.get('/api/alliance/player', async (request, reply) => {
  const { playerId } = request.query;

  try {
    const result = await AllianceSystem.getPlayerAlliance(supabaseAdmin, playerId);
    return reply.send(result);
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Failed to fetch alliance' });
  }
});

fastify.post('/api/alliance/war/declare', async (request, reply) => {
  const { allianceId1, allianceId2 } = request.body;

  try {
    const result = await AllianceSystem.declareWar(supabaseAdmin, allianceId1, allianceId2);
    return reply.send(result);
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Failed to declare war' });
  }
});

fastify.get('/api/alliance/wars', async (request, reply) => {
  const { allianceId } = request.query;

  try {
    const result = await AllianceSystem.getAllianceWars(supabaseAdmin, allianceId);
    return reply.send(result);
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Failed to fetch wars' });
  }
});

// ============================================================================
// VIVRE CARD SYSTEM
// ============================================================================

fastify.post('/api/vivrecard/create', async (request, reply) => {
  const { ownerId, targetPlayerId } = request.body;

  try {
    const { error } = await supabaseAdmin
      .from('vivre_cards')
      .insert([{ owner_id: ownerId, target_player_id: targetPlayerId, condition: 100 }]);

    if (error) {
      return reply.status(400).send({ error: 'Failed to create vivre card' });
    }

    return reply.send({ success: true, message: 'Vivre card created' });
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Server error' });
  }
});

// ============================================================================
// DAVY BACK FIGHT SYSTEM
// ============================================================================

fastify.post('/api/game/davy-back-fight/complete', async (request, reply) => {
  const { playerId, games, totalBounty } = request.body;

  try {
    // Validate player exists
    const { data: player, error: playerError } = await supabaseAdmin
      .from('players')
      .select('id, bounty')
      .eq('id', playerId)
      .single();

    if (playerError || !player) {
      return reply.status(400).send({ success: false, message: 'Player not found' });
    }

    // Award bounty
    const newBounty = (player.bounty || 0) + totalBounty;
    const { error: updateError } = await supabaseAdmin
      .from('players')
      .update({ bounty: newBounty })
      .eq('id', playerId);

    if (updateError) {
      return reply.status(400).send({ success: false, message: 'Failed to award bounty' });
    }

    // Log tournament results (optional)
    const { error: logError } = await supabaseAdmin
      .from('tournament_results')
      .insert([{
        player_id: playerId,
        games_completed: games.length,
        total_bounty: totalBounty,
        results: JSON.stringify(games),
        completed_at: new Date().toISOString()
      }])
      .select();

    return reply.send({
      success: true,
      message: `Tournament complete! Earned ${totalBounty} bounty!`,
      newBounty,
      totalBounty
    });
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ success: false, message: 'Server error' });
  }
});

// ============================================================================
// START SERVER
// ============================================================================

fastify.get('/api/vivrecard/list', async (request, reply) => {
  const { playerId } = request.query;

  try {
    const { data: cards, error } = await supabaseAdmin
      .from('vivre_cards')
      .select(`
        id,
        target_player_id,
        condition,
        created_at,
        players:target_player_id (
          id,
          username,
          bounty
        )
      `)
      .eq('owner_id', playerId);

    if (error) {
      return reply.status(500).send({ error: 'Failed to fetch vivre cards' });
    }

    return reply.send({ success: true, cards: cards || [] });
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Server error' });
  }
});

// ============================================================================
// LEADERBOARD & RANKINGS
// ============================================================================

fastify.get('/api/leaderboard/bounty', async (request, reply) => {
  const { limit = 50 } = request.query;

  try {
    const { data: rankings, error } = await supabaseAdmin
      .from('player_rankings')
      .select('*')
      .order('total_bounty', { ascending: false })
      .limit(parseInt(limit));

    if (error) {
      return reply.status(500).send({ error: 'Failed to fetch rankings' });
    }

    return reply.send({ success: true, rankings: rankings || [] });
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Server error' });
  }
});

fastify.get('/api/leaderboard/poneglyphs', async (request, reply) => {
  const { limit = 50 } = request.query;

  try {
    const { data: rankings, error } = await supabaseAdmin
      .from('player_rankings')
      .select('*')
      .order('poneglyphs_found', { ascending: false })
      .limit(parseInt(limit));

    if (error) {
      return reply.status(500).send({ error: 'Failed to fetch rankings' });
    }

    return reply.send({ success: true, rankings: rankings || [] });
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Server error' });
  }
});

fastify.get('/api/leaderboard/alliance', async (request, reply) => {
  const { limit = 50 } = request.query;

  try {
    const { data: alliances, error } = await supabaseAdmin
      .from('alliances')
      .select('*')
      .order('total_bounty', { ascending: false })
      .limit(parseInt(limit));

    if (error) {
      return reply.status(500).send({ error: 'Failed to fetch alliances' });
    }

    return reply.send({ success: true, alliances: alliances || [] });
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Server error' });
  }
});

fastify.get('/api/player/stats', async (request, reply) => {
  const { playerId } = request.query;

  try {
    const { data: stats, error } = await supabaseAdmin
      .from('player_rankings')
      .select('*')
      .eq('player_id', playerId)
      .single();

    if (error || !stats) {
      return reply.status(500).send({ error: 'Failed to fetch stats' });
    }

    return reply.send({ success: true, stats });
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Server error' });
  }
});

// ============================================================================
// START SERVER
// ============================================================================

const start = async () => {
  try {
    await fastify.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' });
    fastify.log.info(`🏴‍☠️ One Piece Game Server running on http://0.0.0.0:${process.env.PORT || 3000}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
