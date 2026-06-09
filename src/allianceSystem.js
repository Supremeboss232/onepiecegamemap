/**
 * Alliance System
 * Manages player alliances, governance, wars, and treasury
 */

class AllianceSystem {
  /**
   * Create a new alliance
   */
  static async createAlliance(supabaseAdmin, leaderId, allianceName) {
    try {
      // Check if alliance name is unique
      const { data: existing } = await supabaseAdmin
        .from('alliances')
        .select('id')
        .eq('name', allianceName)
        .single();

      if (existing) {
        return { success: false, message: 'Alliance name already taken' };
      }

      // Create alliance
      const { data: alliance, error } = await supabaseAdmin
        .from('alliances')
        .insert([{
          name: allianceName,
          leader_id: leaderId,
          member_count: 1,
          treasury: 0,
          total_bounty: 0
        }])
        .select();

      if (error || !alliance || !alliance[0]) {
        return { success: false, message: 'Failed to create alliance' };
      }

      // Add leader as member
      const { error: memberError } = await supabaseAdmin
        .from('alliance_members')
        .insert([{
          alliance_id: alliance[0].id,
          player_id: leaderId,
          role: 'Leader'
        }]);

      if (memberError) {
        return { success: false, message: 'Failed to add leader to alliance' };
      }

      return {
        success: true,
        alliance: alliance[0],
        message: `${allianceName} alliance created!`
      };
    } catch (err) {
      console.error('Alliance creation error:', err);
      return { success: false, message: 'Server error' };
    }
  }

  /**
   * Join an existing alliance
   */
  static async joinAlliance(supabaseAdmin, playerId, allianceId) {
    try {
      // Check if already in alliance
      const { data: existing } = await supabaseAdmin
        .from('alliance_members')
        .select('id')
        .eq('player_id', playerId)
        .single();

      if (existing) {
        return { success: false, message: 'Already in an alliance' };
      }

      // Add member
      const { data: member, error } = await supabaseAdmin
        .from('alliance_members')
        .insert([{
          alliance_id: allianceId,
          player_id: playerId,
          role: 'Member'
        }])
        .select();

      if (error) {
        return { success: false, message: 'Failed to join alliance' };
      }

      // Update member count
      const { error: countError } = await supabaseAdmin
        .rpc('increment_alliance_members', { alliance_id: allianceId });

      return {
        success: true,
        message: 'Joined alliance successfully',
        member: member[0]
      };
    } catch (err) {
      console.error('Join alliance error:', err);
      return { success: false, message: 'Server error' };
    }
  }

  /**
   * Get all alliances with member counts
   */
  static async getAllAlliances(supabaseAdmin) {
    try {
      const { data: alliances, error } = await supabaseAdmin
        .from('alliances')
        .select('*')
        .order('total_bounty', { ascending: false });

      if (error) {
        return { success: false, alliances: [] };
      }

      return {
        success: true,
        alliances: alliances || [],
        totalCount: alliances?.length || 0
      };
    } catch (err) {
      console.error('Get alliances error:', err);
      return { success: false, alliances: [] };
    }
  }

  /**
   * Get alliance members
   */
  static async getAllianceMembers(supabaseAdmin, allianceId) {
    try {
      const { data: members, error } = await supabaseAdmin
        .from('alliance_members')
        .select(`
          id,
          player_id,
          role,
          joined_at,
          players:player_id (
            id,
            username,
            bounty,
            total_bounty
          )
        `)
        .eq('alliance_id', allianceId);

      if (error) {
        return { success: false, members: [] };
      }

      return {
        success: true,
        members: members || [],
        memberCount: members?.length || 0
      };
    } catch (err) {
      console.error('Get alliance members error:', err);
      return { success: false, members: [] };
    }
  }

  /**
   * Get player's alliance
   */
  static async getPlayerAlliance(supabaseAdmin, playerId) {
    try {
      const { data: member, error } = await supabaseAdmin
        .from('alliance_members')
        .select(`
          id,
          role,
          alliances (
            id,
            name,
            leader_id,
            created_at,
            treasury,
            member_count,
            total_bounty
          )
        `)
        .eq('player_id', playerId)
        .single();

      if (error || !member) {
        return { success: false, alliance: null };
      }

      return {
        success: true,
        alliance: member.alliances,
        role: member.role
      };
    } catch (err) {
      console.error('Get player alliance error:', err);
      return { success: false, alliance: null };
    }
  }

  /**
   * Add bounty to alliance treasury
   */
  static async contributeTreasury(supabaseAdmin, allianceId, amount) {
    try {
      const { error } = await supabaseAdmin
        .from('alliances')
        .update({ treasury: supabaseAdmin.raw('treasury + ?', [amount]) })
        .eq('id', allianceId);

      if (error) {
        return { success: false, message: 'Failed to contribute' };
      }

      return { success: true, message: 'Contributed to alliance treasury' };
    } catch (err) {
      console.error('Contribute treasury error:', err);
      return { success: false, message: 'Server error' };
    }
  }

  /**
   * Declare war on another alliance
   */
  static async declareWar(supabaseAdmin, allianceId1, allianceId2) {
    try {
      // Check if already at war
      const { data: existing } = await supabaseAdmin
        .from('alliance_wars')
        .select('id')
        .eq('status', 'ongoing')
        .or(`and(alliance_1_id.eq.${allianceId1},alliance_2_id.eq.${allianceId2}),and(alliance_1_id.eq.${allianceId2},alliance_2_id.eq.${allianceId1})`)
        .single();

      if (existing) {
        return { success: false, message: 'Already at war with this alliance' };
      }

      // Create war record
      const { data: war, error } = await supabaseAdmin
        .from('alliance_wars')
        .insert([{
          alliance_1_id: allianceId1,
          alliance_2_id: allianceId2,
          status: 'ongoing'
        }])
        .select();

      if (error) {
        return { success: false, message: 'Failed to declare war' };
      }

      return {
        success: true,
        war: war[0],
        message: 'War declared!'
      };
    } catch (err) {
      console.error('Declare war error:', err);
      return { success: false, message: 'Server error' };
    }
  }

  /**
   * Get alliance wars
   */
  static async getAllianceWars(supabaseAdmin, allianceId) {
    try {
      const { data: wars, error } = await supabaseAdmin
        .from('alliance_wars')
        .select('*')
        .or(`alliance_1_id.eq.${allianceId},alliance_2_id.eq.${allianceId}`)
        .order('started_at', { ascending: false });

      if (error) {
        return { success: false, wars: [] };
      }

      return {
        success: true,
        wars: wars || []
      };
    } catch (err) {
      console.error('Get wars error:', err);
      return { success: false, wars: [] };
    }
  }
}

export default AllianceSystem;
