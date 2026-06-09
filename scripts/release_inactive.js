import dotenv from 'dotenv';
import { supabaseAdmin } from '../src/supabaseAdmin.js';

dotenv.config();

const INACTIVITY_LIMIT_DAYS = parseInt(process.env.INACTIVITY_LIMIT_DAYS || '14', 10);

async function releaseInactive() {
  const cutoff = new Date(Date.now() - INACTIVITY_LIMIT_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: players, error: playersError } = await supabaseAdmin
    .from('players')
    .select('id, username, last_action, created_at')
    .or(`last_action.lt.${cutoff},created_at.lt.${cutoff}`);

  if (playersError) {
    throw playersError;
  }

  for (const player of players || []) {
    const playerId = player.id;
    console.log('Releasing assets for inactive player', player.username || playerId);

    const { data: chars, error: charsError } = await supabaseAdmin
      .from('crew_members')
      .select('id, origin_island_id')
      .eq('owner_id', playerId)
      .eq('is_unique', true)
      .eq('status', 'owned');

    if (charsError) {
      throw charsError;
    }

    for (const char of chars || []) {
      const { error: updateError } = await supabaseAdmin
        .from('crew_members')
        .update({ owner_id: null, status: 'Free_Agent', loyalty: 50, released_at: new Date().toISOString() })
        .eq('id', char.id);

      if (updateError) {
        throw updateError;
      }

      const { error: eventError } = await supabaseAdmin
        .from('events')
        .insert([{ type: 'release_unique', payload: { char_id: char.id, spawn_island_id: char.origin_island_id } }]);

      if (eventError) {
        throw eventError;
      }
    }

    const { error: territoryError } = await supabaseAdmin
      .from('territories')
      .delete()
      .eq('owner_id', playerId);

    if (territoryError) {
      throw territoryError;
    }

    const { error: stripEventError } = await supabaseAdmin
      .from('events')
      .insert([{ type: 'strip_territories', payload: { player_id: playerId } }]);

    if (stripEventError) {
      throw stripEventError;
    }
  }

  console.log('Inactive release complete');
}

releaseInactive().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
