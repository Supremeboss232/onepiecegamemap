/**
 * Poneglyph Discovery System
 * Manages poneglyph discovery mechanics, cooldowns, and progression
 */

class PoneglyPHSystem {
  // Poneglyph data
  static PONEGLYPHS = [
    {
      id: 1,
      name: 'Alabasta Poneglyph',
      location: 'Alabasta',
      nodeId: 5,
      lore: 'Ancient history stone - Holds secrets of the Void Century'
    },
    {
      id: 2,
      name: 'Jaya Poneglyph',
      location: 'Shandora Sky Island',
      nodeId: 7,
      lore: 'Sky island relic - Records of lost civilization'
    },
    {
      id: 3,
      name: 'Water 7 Poneglyph',
      location: 'Underground Ruins',
      nodeId: 8,
      lore: 'City beneath the city - Warning of ancient weapons'
    },
    {
      id: 4,
      name: 'Sabaody Poneglyph',
      location: 'Sabaody Archipelago',
      nodeId: 9,
      lore: 'Mangrove forest artifact - Dangerous knowledge'
    },
    {
      id: 5,
      name: 'Amazon Lily Poneglyph',
      location: 'Amazon Lily',
      nodeId: 11,
      lore: 'Isle of women - Ancient warrior records'
    },
    {
      id: 6,
      name: 'Impel Down Poneglyph',
      location: 'Impel Down Prison',
      nodeId: 13,
      lore: 'Lowest security level - Government secrets'
    },
    {
      id: 7,
      name: 'Marineford Poneglyph',
      location: 'Marineford Base',
      nodeId: 15,
      lore: 'Marine headquarters - Hidden in plain sight'
    },
    {
      id: 8,
      name: 'Wano Poneglyph',
      location: 'Wano Country',
      nodeId: 17,
      lore: 'Samurai homeland - Weapons of the world'
    },
    {
      id: 9,
      name: 'Laugh Tale Poneglyph',
      location: 'Laugh Tale',
      nodeId: 30,
      lore: 'Final island - True history revealed'
    }
  ];

  static DISCOVERY_CHANCE = 0.30; // 30% chance per attempt
  static DISCOVERY_COST = 100000; // Bounty cost
  static COOLDOWN_MS = 3600000; // 1 hour
  static PONEGLYPHS_TO_LAUGH_TALE = 5; // Need 5+ to unlock

  /**
   * Attempt to discover a poneglyph
   * @param {Object} supabaseAdmin - Supabase admin client
   * @param {string} playerId - Player ID
   * @returns {Object} Result { success, discovered, poneglyph, message }
   */
  static async discoverPoneglyph(supabaseAdmin, playerId) {
    try {
      // Get player data
      const { data: player, error: playerError } = await supabaseAdmin
        .from('players')
        .select('id, bounty, total_bounty')
        .eq('id', playerId)
        .single();

      if (playerError || !player) {
        return { success: false, message: 'Player not found' };
      }

      // Check bounty balance
      if (player.bounty < this.DISCOVERY_COST) {
        return { 
          success: false, 
          message: `Insufficient bounty. Need ${this.DISCOVERY_COST}, have ${player.bounty}` 
        };
      }

      // Get discovered poneglyphs
      const { data: discovered, error: discError } = await supabaseAdmin
        .from('player_poneglyphs')
        .select('poneglyph_id')
        .eq('player_id', playerId);

      if (discError) {
        return { success: false, message: 'Failed to fetch discovered poneglyphs' };
      }

      const discoveredIds = new Set(discovered?.map(p => p.poneglyph_id) || []);

      // Find undiscovered poneglyph
      const undiscovered = this.PONEGLYPHS.filter(p => !discoveredIds.has(p.id));

      if (undiscovered.length === 0) {
        return { 
          success: false, 
          message: 'All poneglyphs discovered! You can now access Laugh Tale.',
          allDiscovered: true 
        };
      }

      // Roll for discovery
      const discovered_this_attempt = Math.random() < this.DISCOVERY_CHANCE;

      if (discovered_this_attempt) {
        // Random poneglyph from undiscovered
        const poneglyph = undiscovered[Math.floor(Math.random() * undiscovered.length)];

        // Record discovery
        const { error: insertError } = await supabaseAdmin
          .from('player_poneglyphs')
          .insert([{
            player_id: playerId,
            poneglyph_id: poneglyph.id,
            discovered_at: new Date().toISOString()
          }]);

        if (insertError) {
          return { success: false, message: 'Failed to record discovery' };
        }

        // Deduct bounty
        const { error: updateError } = await supabaseAdmin
          .from('players')
          .update({ bounty: player.bounty - this.DISCOVERY_COST })
          .eq('id', playerId);

        if (updateError) {
          return { success: false, message: 'Failed to deduct bounty' };
        }

        return {
          success: true,
          discovered: true,
          poneglyph,
          remainingCount: undiscovered.length - 1,
          bountyRemaining: player.bounty - this.DISCOVERY_COST,
          message: `Discovered ${poneglyph.name}! Bounty: -${this.DISCOVERY_COST}`
        };
      } else {
        // Failed discovery, still deduct bounty
        const { error: updateError } = await supabaseAdmin
          .from('players')
          .update({ bounty: player.bounty - this.DISCOVERY_COST })
          .eq('id', playerId);

        if (updateError) {
          return { success: false, message: 'Failed to deduct bounty' };
        }

        return {
          success: true,
          discovered: false,
          bountyRemaining: player.bounty - this.DISCOVERY_COST,
          message: `Discovery failed. Better luck next time! Bounty: -${this.DISCOVERY_COST}`
        };
      }
    } catch (err) {
      console.error('Poneglyph discovery error:', err);
      return { success: false, message: 'Server error during discovery' };
    }
  }

  /**
   * Get player's discovered poneglyphs
   */
  static async getDiscoveredPoneglyphs(supabaseAdmin, playerId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('player_poneglyphs')
        .select('poneglyph_id, discovered_at')
        .eq('player_id', playerId);

      if (error) {
        return { success: false, poneglyphs: [] };
      }

      const discoveredIds = new Set(data?.map(p => p.poneglyph_id) || []);
      const discovered = this.PONEGLYPHS.filter(p => discoveredIds.has(p.id));

      return {
        success: true,
        poneglyphs: discovered,
        count: discovered.length,
        canAccessLaughTale: discovered.length >= this.PONEGLYPHS_TO_LAUGH_TALE
      };
    } catch (err) {
      console.error('Error getting discovered poneglyphs:', err);
      return { success: false, poneglyphs: [] };
    }
  }

  /**
   * Get all poneglyphs with discovery status
   */
  static async getAllPoneglyPHs(supabaseAdmin, playerId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('player_poneglyphs')
        .select('poneglyph_id')
        .eq('player_id', playerId);

      const discoveredIds = new Set(data?.map(p => p.poneglyph_id) || []);
      
      const poneglyphsWithStatus = this.PONEGLYPHS.map(p => ({
        ...p,
        discovered: discoveredIds.has(p.id)
      }));

      return {
        success: true,
        poneglyphs: poneglyphsWithStatus,
        discoveredCount: discoveredIds.size,
        canAccessLaughTale: discoveredIds.size >= this.PONEGLYPHS_TO_LAUGH_TALE
      };
    } catch (err) {
      console.error('Error getting all poneglyphs:', err);
      return { success: false, poneglyphs: [] };
    }
  }
}

export default PoneglyPHSystem;
