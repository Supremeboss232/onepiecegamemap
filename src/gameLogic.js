import { supabaseAdmin } from './supabaseAdmin.js';

export class GameEngine {
  constructor() {
    this.INACTIVITY_LIMIT_DAYS = parseInt(process.env.INACTIVITY_LIMIT_DAYS || '14');
    this.CONGESTION_STATIC_HOURS = parseInt(process.env.CONGESTION_STATIC_HOURS || '48');
    this.CONGESTION_SHIP_THRESHOLD = parseInt(process.env.CONGESTION_SHIP_THRESHOLD || '3');
    this.CONGESTION_SHIP_DAMAGE = parseInt(process.env.CONGESTION_SHIP_DAMAGE || '200');
    this.BLUES_BOUNTY_THRESHOLD = parseInt(process.env.BLUES_BOUNTY_THRESHOLD || '100000000');
    this.BLUES_STATIC_MINUTES = parseInt(process.env.BLUES_STATIC_MINUTES || '60');
    this.BLUES_AGGRESSION_MULTIPLIER = parseInt(process.env.BLUES_AGGRESSION_MULTIPLIER || '5');
  }

  // ============================================================================
  // MAP STATE & NAVIGATION
  // ============================================================================

  async getMapState() {
    try {
      const [{ data: nodes }, { data: ships }, { data: territories }] = await Promise.all([
        supabaseAdmin.from('nodes').select('*'),
        supabaseAdmin.from('ships').select('*'),
        supabaseAdmin.from('territories').select('*')
      ]);

      return { nodes: nodes || [], ships: ships || [], territories: territories || [] };
    } catch (error) {
      throw new Error(`Failed to fetch map state: ${error.message}`);
    }
  }

  async getAvailableRoutes(nodeId) {
    try {
      const { data: edges, error } = await supabaseAdmin
        .from('node_edges')
        .select('*')
        .or(`from_node_id.eq.${nodeId},to_node_id.eq.${nodeId}`);

      if (error) throw error;

      return edges || [];
    } catch (error) {
      throw new Error(`Failed to fetch routes: ${error.message}`);
    }
  }

  // ============================================================================
  // PLAYER STATE MANAGEMENT
  // ============================================================================

  async getPlayerState(playerId) {
    try {
      const [{ data: player }, { data: ships }, { data: crew }, { data: territories }] = await Promise.all([
        supabaseAdmin.from('players').select('*').eq('id', playerId).single(),
        supabaseAdmin.from('ships').select('*').eq('player_id', playerId),
        supabaseAdmin.from('global_characters').select('*').eq('current_owner_id', playerId),
        supabaseAdmin.from('territories').select('*').eq('owner_id', playerId)
      ]);

      return { player, ships: ships || [], crew: crew || [], territories: territories || [] };
    } catch (error) {
      throw new Error(`Failed to fetch player state: ${error.message}`);
    }
  }

  async updatePlayerActivity(playerId) {
    try {
      await supabaseAdmin
        .from('players')
        .update({ last_action: new Date().toISOString() })
        .eq('id', playerId);
    } catch (error) {
      console.error(`Failed to update player activity: ${error.message}`);
    }
  }

  // ============================================================================
  // MOVEMENT & NAVIGATION
  // ============================================================================

  async moveShip(playerId, shipId, targetNodeId) {
    try {
      // Get ship info
      const { data: ship, error: shipError } = await supabaseAdmin
        .from('ships')
        .select('*')
        .eq('id', shipId)
        .single();

      if (shipError || !ship) {
        throw new Error('Ship not found');
      }

      if (ship.player_id !== playerId) {
        throw new Error('Ship does not belong to this player');
      }

      // Validate edge connectivity (graph-based routing)
      const { data: edges, error: edgeError } = await supabaseAdmin
        .from('node_edges')
        .select('*')
        .or(`and(from_node_id.eq.${ship.node_id},to_node_id.eq.${targetNodeId}),and(from_node_id.eq.${targetNodeId},to_node_id.eq.${ship.node_id})`);

      if (edgeError || !edges || edges.length === 0) {
        throw new Error('No valid route to target node');
      }

      // Apply congestion damage if needed
      const { data: congestion } = await supabaseAdmin
        .from('node_congestion')
        .select('*')
        .eq('node_id', targetNodeId)
        .single();

      let hullDamage = 0;
      if (congestion && congestion.static_ship_count > this.CONGESTION_SHIP_THRESHOLD) {
        hullDamage = this.CONGESTION_SHIP_DAMAGE;
      }

      // Update ship position
      const { error: updateError } = await supabaseAdmin
        .from('ships')
        .update({
          node_id: targetNodeId,
          hull: Math.max(0, (ship.hull || 1000) - hullDamage),
          last_moved_at: new Date().toISOString()
        })
        .eq('id', shipId);

      if (updateError) {
        throw new Error('Failed to update ship position');
      }

      // Record event
      await supabaseAdmin.from('events').insert([{
        type: 'ship_movement',
        payload: { player_id: playerId, ship_id: shipId, from_node: ship.node_id, to_node: targetNodeId, hull_damage: hullDamage }
      }]);

      // Update player activity
      await this.updatePlayerActivity(playerId);

      return { success: true, ship_id: shipId, new_position: targetNodeId, hull_damage: hullDamage };
    } catch (error) {
      throw new Error(`Movement failed: ${error.message}`);
    }
  }

  // ============================================================================
  // TERRITORY MANAGEMENT
  // ============================================================================

  async claimTerritory(playerId, shipId, governanceTier) {
    try {
      const { data: ship } = await supabaseAdmin.from('ships').select('*').eq('id', shipId).single();

      if (!ship || ship.player_id !== playerId) {
        throw new Error('Ship not found or does not belong to player');
      }

      // Check if node already claimed
      const { data: existing } = await supabaseAdmin
        .from('territories')
        .select('*')
        .eq('node_id', ship.node_id)
        .single();

      if (existing && existing.owner_id !== playerId) {
        throw new Error('Territory already claimed by another player');
      }

      // Claim territory
      const { error: claimError } = await supabaseAdmin
        .from('territories')
        .upsert([{
          owner_id: playerId,
          node_id: ship.node_id,
          governance_tier: governanceTier,
          claimed_at: new Date().toISOString()
        }], { onConflict: 'node_id' });

      if (claimError) {
        throw new Error('Failed to claim territory');
      }

      await supabaseAdmin.from('events').insert([{
        type: 'territory_claimed',
        payload: { player_id: playerId, node_id: ship.node_id, governance_tier: governanceTier }
      }]);

      return { success: true, territory_claimed: true };
    } catch (error) {
      throw new Error(`Territory claim failed: ${error.message}`);
    }
  }

  // ============================================================================
  // CREW MANAGEMENT & RECRUITMENT
  // ============================================================================

  async recruitCrewMember(playerId, characterId) {
    try {
      const { data: character } = await supabaseAdmin
        .from('global_characters')
        .select('*')
        .eq('id', characterId)
        .single();

      if (!character) {
        throw new Error('Character not found');
      }

      if (character.current_status !== 'Free_Agent') {
        throw new Error('Character is not available for recruitment');
      }

      // Check loyalty (randomized tavern discovery mechanic)
      const loyaltyRoll = Math.random() * 100;
      const loyaltyThreshold = character.loyalty_score || 50;

      if (loyaltyRoll > loyaltyThreshold) {
        throw new Error(`Character rejected recruitment (loyalty check failed: ${loyaltyRoll.toFixed(0)} > ${loyaltyThreshold})`);
      }

      // Recruit character
      const { error: updateError } = await supabaseAdmin
        .from('global_characters')
        .update({
          current_owner_id: playerId,
          current_status: 'Active_Crew',
          discovered_at: new Date().toISOString()
        })
        .eq('id', characterId);

      if (updateError) {
        throw new Error('Failed to recruit character');
      }

      // Apply stat bonuses to player
      const { data: player } = await supabaseAdmin.from('players').select('*').eq('id', playerId).single();
      const newStats = {
        strength: (player.strength || 100) + (character.base_str || 5),
        intelligence: (player.intelligence || 100) + (character.base_int || 5),
        willpower: (player.willpower || 100) + (character.base_will || 5)
      };

      await supabaseAdmin
        .from('players')
        .update(newStats)
        .eq('id', playerId);

      await supabaseAdmin.from('events').insert([{
        type: 'crew_recruited',
        payload: { player_id: playerId, character_id: characterId, character_name: character.name }
      }]);

      return { success: true, character_recruited: characterId, stat_bonuses: newStats };
    } catch (error) {
      throw new Error(`Recruitment failed: ${error.message}`);
    }
  }

  // ============================================================================
  // COMBAT ENGINE
  // ============================================================================

  async processCombatAction(combatId, playerId, hakiType, staminaCost) {
    try {
      const { data: combat } = await supabaseAdmin
        .from('combat_sessions')
        .select('*')
        .eq('id', combatId)
        .single();

      if (!combat) {
        throw new Error('Combat session not found');
      }

      if (combat.status !== 'active') {
        throw new Error('Combat is not active');
      }

      // Determine whose turn it is
      const isAttacker = combat.attacker_id === playerId;
      const stamKey = isAttacker ? 'attacker_stamina' : 'defender_stamina';
      const hakiKey = isAttacker ? 'attacker_haki_type' : 'defender_haki_type';

      const currentStamina = combat[stamKey] || 100;
      if (currentStamina < staminaCost) {
        throw new Error(`Insufficient stamina (${currentStamina} < ${staminaCost})`);
      }

      const newStamina = currentStamina - staminaCost;

      // Calculate damage based on haki matchup
      let damage = await this.calculateHakiDamage(hakiType, isAttacker ? combat.defender_haki_type : combat.attacker_haki_type);

      // Update combat state
      const updates = {
        [stamKey]: newStamina,
        [hakiKey]: hakiType,
        combat_turn: combat.combat_turn + 1
      };

      // Check for winner (stamina depleted or surrender)
      if (newStamina <= 0) {
        updates.status = 'completed';
        updates.winner_id = isAttacker ? combat.defender_id : combat.attacker_id;
        updates.ended_at = new Date().toISOString();

        // Award bounty or consequences
        const winner_id = updates.winner_id;
        const loser_id = isAttacker ? combat.defender_id : combat.attacker_id;
        await this.applyBountyModifier(winner_id, 'Combat_Victory', 5000000, `Defeated ${loser_id} in combat`);
      }

      const { error: updateError } = await supabaseAdmin
        .from('combat_sessions')
        .update(updates)
        .eq('id', combatId);

      if (updateError) {
        throw new Error('Failed to process combat action');
      }

      return {
        success: true,
        combat_turn: combat.combat_turn + 1,
        damage_dealt: damage,
        new_stamina: newStamina,
        status: updates.status || 'active'
      };
    } catch (error) {
      throw new Error(`Combat action failed: ${error.message}`);
    }
  }

  async calculateHakiDamage(userHaki, opponentHaki) {
    // Haki system: Observation > Armament > Conqueror > Observation (rock-paper-scissors)
    const hakiHierarchy = {
      'Observation': 'Conqueror',
      'Armament': 'Observation',
      'Conqueror': 'Armament'
    };

    const baseDamage = 150;
    if (hakiHierarchy[userHaki] === opponentHaki) {
      return baseDamage * 1.5; // Super effective
    } else if (hakiHierarchy[opponentHaki] === userHaki) {
      return baseDamage * 0.5; // Not very effective
    }
    return baseDamage; // Normal
  }

  // ============================================================================
  // BOUNTY ENGINE
  // ============================================================================

  async applyBountyModifier(playerId, modifierType, modifierValue, reason) {
    try {
      const { error: insertError } = await supabaseAdmin
        .from('bounty_modifiers')
        .insert([{ 
          player_id: playerId, 
          modifier_type: modifierType, 
          modifier_value: modifierValue, 
          reason 
        }]);

      if (insertError) {
        throw new Error('Failed to apply bounty modifier');
      }

      // Recalculate total bounty
      const { data: modifiers } = await supabaseAdmin
        .from('bounty_modifiers')
        .select('modifier_value')
        .eq('player_id', playerId);

      const totalModifier = (modifiers || []).reduce((sum, m) => sum + m.modifier_value, 0);

      const { error: updateError } = await supabaseAdmin
        .from('players')
        .update({ total_bounty: totalModifier })
        .eq('id', playerId);

      if (updateError) {
        throw new Error('Failed to update bounty');
      }

      return { success: true, new_bounty: totalModifier };
    } catch (error) {
      throw new Error(`Bounty modifier failed: ${error.message}`);
    }
  }

  async calculatePlayerBounty(playerId) {
    try {
      const { data: modifiers } = await supabaseAdmin
        .from('bounty_modifiers')
        .select('modifier_value')
        .eq('player_id', playerId);

      return (modifiers || []).reduce((sum, m) => sum + m.modifier_value, 0);
    } catch (error) {
      throw new Error(`Bounty calculation failed: ${error.message}`);
    }
  }

  // ============================================================================
  // PONEGLYPH DISCOVERY SYSTEM
  // ============================================================================

  async discoverPoneglyph(playerId, poneglyphId) {
    try {
      const { data: poneglyph } = await supabaseAdmin
        .from('poneglyphs')
        .select('*')
        .eq('id', poneglyphId)
        .single();

      if (!poneglyph) {
        throw new Error('Poneglyph not found');
      }

      // Record rubbing
      const { error: insertError } = await supabaseAdmin
        .from('player_poneglyph_rubbings')
        .insert([{
          player_id: playerId,
          poneglyph_id: poneglyphId,
          rubbing_data: poneglyph.ancient_text,
          acquired_at: new Date().toISOString()
        }]);

      if (insertError && !insertError.message.includes('duplicate')) {
        throw new Error('Failed to record Poneglyph rubbing');
      }

      // Check if all poneglyphs discovered
      const { data: allPoneglyphs } = await supabaseAdmin.from('poneglyphs').select('id');
      const { data: playerRubbings } = await supabaseAdmin
        .from('player_poneglyph_rubbings')
        .select('id')
        .eq('player_id', playerId);

      const allFound = allPoneglyphs && playerRubbings && playerRubbings.length >= allPoneglyphs.length;

      if (allFound) {
        const { error: pathError } = await supabaseAdmin
          .from('laugh_tale_paths')
          .upsert([{ 
            player_id: playerId, 
            path_unlocked: true, 
            unlocked_at: new Date().toISOString() 
          }], { onConflict: 'player_id' });

        if (!pathError) {
          // Award victory bounty
          await this.applyBountyModifier(playerId, 'Laugh_Tale_Victory', 100000000, 'Discovered all Poneglyphs and reached Laugh Tale');
        }
      }

      await supabaseAdmin.from('events').insert([{
        type: 'poneglyph_discovered',
        payload: { player_id: playerId, poneglyph_id: poneglyphId, path_unlocked: allFound }
      }]);

      return { success: true, poneglyph_discovered: true, path_unlocked: allFound };
    } catch (error) {
      throw new Error(`Poneglyph discovery failed: ${error.message}`);
    }
  }

  // ============================================================================
  // MAINTENANCE & SYSTEM OPERATIONS
  // ============================================================================

  async releaseInactiveCrewMembers() {
    try {
      const inactivityCutoff = new Date(Date.now() - this.INACTIVITY_LIMIT_DAYS * 24 * 60 * 60 * 1000).toISOString();

      const { data: inactivePlayers } = await supabaseAdmin
        .from('players')
        .select('id')
        .lt('last_action', inactivityCutoff);

      if (!inactivePlayers || inactivePlayers.length === 0) {
        return { released: 0 };
      }

      let released = 0;
      for (const player of inactivePlayers) {
        const { data: crew } = await supabaseAdmin
          .from('global_characters')
          .select('*')
          .eq('current_owner_id', player.id)
          .eq('current_status', 'Active_Crew');

        if (crew && crew.length > 0) {
          for (const member of crew) {
            await supabaseAdmin
              .from('global_characters')
              .update({ current_owner_id: null, current_status: 'Free_Agent', loyalty_score: 50 })
              .eq('id', member.id);

            released++;
          }
        }

        // Strip territories
        await supabaseAdmin
          .from('territories')
          .delete()
          .eq('owner_id', player.id);
      }

      return { released };
    } catch (error) {
      console.error(`Release inactive crew failed: ${error.message}`);
      return { released: 0, error: error.message };
    }
  }
}
