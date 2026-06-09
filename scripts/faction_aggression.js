import dotenv from 'dotenv';
import { supabaseAdmin } from '../src/supabaseAdmin.js';

dotenv.config();

const BOUNTY_THRESHOLD = parseInt(process.env.BLUES_BOUNTY_THRESHOLD || '100000000', 10);
const STATIC_MINUTES = parseInt(process.env.BLUES_STATIC_MINUTES || '60', 10);
const MAX_MULTIPLIER = parseInt(process.env.BLUES_AGGRESSION_MULTIPLIER || '5', 10);

async function enforceAggression() {
  const cutoff = new Date(Date.now() - STATIC_MINUTES * 60 * 1000).toISOString();

  const { data: bluesNodes, error: nodeError } = await supabaseAdmin
    .from('nodes')
    .select('id,name')
    .eq('region', 'Blues');

  if (nodeError) {
    throw nodeError;
  }

  const nodeIds = (bluesNodes || []).map((node) => node.id);
  if (nodeIds.length === 0) {
    console.log('No Blues nodes found. Faction aggression pass skipped.');
    return;
  }

  const { data: ships, error: shipsError } = await supabaseAdmin
    .from('ships')
    .select('id,player_id,node_id,last_moved_at')
    .in('node_id', nodeIds);

  if (shipsError) {
    throw shipsError;
  }

  const shipPlayers = new Set((ships || []).map((ship) => ship.player_id));
  const { data: players, error: playersError } = await supabaseAdmin
    .from('players')
    .select('id,username,bounty')
    .in('id', Array.from(shipPlayers))
    .gte('bounty', BOUNTY_THRESHOLD);

  if (playersError) {
    throw playersError;
  }

  const playerById = new Map((players || []).map((player) => [player.id, player]));
  const nodeById = new Map((bluesNodes || []).map((node) => [node.id, node]));

  for (const ship of ships || []) {
    const player = playerById.get(ship.player_id);
    if (!player) continue;
    if (new Date(ship.last_moved_at) >= new Date(cutoff)) continue;

    const node = nodeById.get(ship.node_id);
    const multiplier = Math.min(MAX_MULTIPLIER, Math.max(2, Math.floor((player.bounty || 0) / 50000000)));

    console.log(`Marine response triggered against ${player.username} at ${node?.name || ship.node_id} with bounty ${player.bounty}. Multiplier: ${multiplier}`);

    const { error: eventError } = await supabaseAdmin
      .from('events')
      .insert([{ type: 'marine_response', payload: {
        ship_id: ship.id,
        player_id: ship.player_id,
        node_id: ship.node_id,
        bounty: player.bounty,
        aggression_multiplier: multiplier,
        region: 'Blues',
        triggered_at: new Date().toISOString()
      } }]);

    if (eventError) {
      throw eventError;
    }
  }

  console.log('Faction aggression pass complete');
}

enforceAggression().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
