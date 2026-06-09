import dotenv from 'dotenv';
import { supabaseAdmin } from '../src/supabaseAdmin.js';

dotenv.config();

const HOURS = parseInt(process.env.CONGESTION_STATIC_HOURS || '48', 10);
const THRESHOLD = parseInt(process.env.CONGESTION_SHIP_THRESHOLD || '3', 10);
const DAMAGE = parseInt(process.env.CONGESTION_SHIP_DAMAGE || '200', 10);
const anomalyTypes = ['Knock_Up_Stream', 'Aqua_Laguna', 'Sea_Storm'];

async function checkCongestion() {
  const cutoff = new Date(Date.now() - HOURS * 60 * 60 * 1000).toISOString();
  const { data: ships, error: shipsError } = await supabaseAdmin
    .from('ships')
    .select('id,node_id,last_moved_at,hull');

  if (shipsError) {
    throw shipsError;
  }

  const grouped = new Map();
  for (const ship of ships || []) {
    if (!ship.node_id) continue;

    const stats = grouped.get(ship.node_id) || { shipCount: 0, staticShipCount: 0, staticShips: [] };
    stats.shipCount += 1;

    if (new Date(ship.last_moved_at) < new Date(cutoff)) {
      stats.staticShipCount += 1;
      stats.staticShips.push(ship);
    }

    grouped.set(ship.node_id, stats);
  }

  for (const [nodeId, stats] of grouped.entries()) {
    if (stats.staticShipCount < THRESHOLD) {
      continue;
    }

    const anomalyType = anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)];
    console.log(`Node ${nodeId} has ${stats.staticShipCount} static ships for over ${HOURS} hours; triggering ${anomalyType}.`);

    const { data: neighbors, error: neighborsError } = await supabaseAdmin
      .from('node_edges')
      .select('from_node_id,to_node_id')
      .or(`from_node_id.eq.${nodeId},to_node_id.eq.${nodeId}`);

    if (neighborsError) {
      throw neighborsError;
    }

    const targets = new Set();
    for (const neighbor of neighbors || []) {
      if (neighbor.from_node_id && neighbor.from_node_id !== nodeId) targets.add(neighbor.from_node_id);
      if (neighbor.to_node_id && neighbor.to_node_id !== nodeId) targets.add(neighbor.to_node_id);
    }

    const targetList = Array.from(targets);
    if (targetList.length === 0) {
      console.warn(`No neighboring nodes available for anomaly reroute from ${nodeId}.`);
      continue;
    }

    const { error: congestionError } = await supabaseAdmin
      .from('node_congestion')
      .upsert([
        {
          node_id: nodeId,
          measured_at: new Date().toISOString(),
          ship_count: stats.shipCount,
          static_ship_count: stats.staticShipCount,
          anomaly_active: true,
          anomaly_type: anomalyType,
          anomaly_started_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ], { onConflict: 'node_id' });

    if (congestionError) {
      throw congestionError;
    }

    for (const ship of stats.staticShips) {
      const target = targetList[Math.floor(Math.random() * targetList.length)];
      const newHull = Math.max(0, (ship.hull || 0) - DAMAGE);

      const { error: updateError } = await supabaseAdmin
        .from('ships')
        .update({ node_id: target, last_moved_at: new Date().toISOString(), hull: newHull })
        .eq('id', ship.id);

      if (updateError) {
        throw updateError;
      }

      const { error: eventError } = await supabaseAdmin
        .from('events')
        .insert([{ type: 'congestion_anomaly', payload: { ship_id: ship.id, from_node_id: nodeId, to_node_id: target, anomaly_type: anomalyType, damage: DAMAGE } }]);

      if (eventError) {
        throw eventError;
      }
    }
  }

  console.log('Congestion check complete');
}

checkCongestion().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
