/**
 * Character Generator - One Piece Game
 * Generates random, balanced characters for crew recruitment
 * 
 * Tier 1 (Weak): 0-100K bounty, basic stats
 * Tier 2 (Strong): 100K-10M bounty, mid stats, Devil Fruits
 * Tier 3 (Legendary): 10M-1B+ bounty, high stats, Haki
 */

class CharacterGenerator {
  // Character name pools by tier
  static NAMES = {
    tier1: [
      'Coby', 'Helmeppo', 'Kuro', 'Axe Hand Morgan',
      'Roronoa', 'Nojiko', 'Genzo', 'Arlong',
      'Kuro', 'Jango', 'Buggy', 'Cabaji',
      'Alvida', 'Hatchan', 'Chew', 'Crescent Moon Galley'
    ],
    tier2: [
      'Roronoa Zoro', 'Nami', 'Usopp', 'Sanji', 'Tony Tony Chopper',
      'Nico Robin', 'Franky', 'Brook',
      'Cavendish', 'Bartolomeo', 'Sai', 'Ideo',
      'Leo', 'Hajrudin', 'Moria', 'Doflamingo'
    ],
    tier3: [
      'Shanks', 'Mihawk', 'Big Mom', 'Kaido',
      'Whitebeard', 'Gol D. Roger', 'Gold D. Ace', 'Portgas D. Ace',
      'Admiral Akainu', 'Admiral Aokiji', 'Admiral Kizaru',
      'Blackbeard', 'Dracula Mihawk', 'Boa Hancock', 'Crocodile'
    ]
  };

  // Crew member roles/archetypes
  static ROLES = [
    'Swordsman',      // High strength
    'Navigator',      // High intelligence
    'Doctor',         // Balanced
    'Cook',           // High strength
    'Sniper',         // High willpower
    'Musician',       // Balanced
    'Cyborg',         // High strength
    'Archaeologist'   // High intelligence
  ];

  // Devil Fruits by tier (20% per tier)
  static DEVIL_FRUITS = {
    tier1: [
      'Gomu Gomu no Mi',      // Rubber fruit
      'Yuki Yuki no Mi',      // Snow fruit
      'Sube Sube no Mi',      // Slip fruit
      'Toge Toge no Mi',      // Spike fruit
      'Kilo Kilo no Mi',      // Kilo fruit
      'Bomu Bomu no Mi',      // Bomb fruit
      'Kama Kama no Mi'       // Scythe fruit
    ],
    tier2: [
      'Hie Hie no Mi',        // Ice fruit
      'Ope Ope no Mi',        // Room fruit
      'Shiro Shiro no Mi',    // Castle fruit
      'Buki Buki no Mi',      // Weapon fruit
      'Gasu Gasu no Mi',      // Gas fruit
      'Hobi Hobi no Mi',      // Hobby fruit
      'Noro Noro no Mi'       // Slow fruit
    ],
    tier3: [
      'Soru Soru no Mi',      // Soul fruit
      'Gura Gura no Mi',      // Earthquake fruit
      'Yami Yami no Mi',      // Darkness fruit
      'Pika Pika no Mi',      // Light fruit
      'Moku Moku no Mi',      // Smoke fruit
      'Suna Suna no Mi',      // Sand fruit
      'Mera Mera no Mi'       // Fire fruit
    ]
  };

  // Haki types (Tier 3 only, 50% chance)
  static HAKI_TYPES = [
    'Observation',   // Dodge attacks, predict future
    'Armament',      // Harden body, black coating
    'Conqueror'      // Dominate will (rare)
  ];

  /**
   * Generate a single random character
   * @param {number} tier - Character tier (1, 2, or 3)
   * @returns {Object} Generated character
   */
  static generateCharacter(tier = 1) {
    const role = this.ROLES[Math.floor(Math.random() * this.ROLES.length)];
    const hasDevilFruit = Math.random() < 0.2 * tier;
    const hasHaki = tier >= 3 && Math.random() < 0.5;

    // Role-based stat modifiers
    const roleModifiers = {
      'Swordsman': { strength: 1.3, intelligence: 0.9, willpower: 1.1 },
      'Navigator': { strength: 0.9, intelligence: 1.3, willpower: 1.0 },
      'Doctor': { strength: 1.0, intelligence: 1.2, willpower: 1.1 },
      'Cook': { strength: 1.2, intelligence: 1.0, willpower: 1.0 },
      'Sniper': { strength: 1.0, intelligence: 1.1, willpower: 1.2 },
      'Musician': { strength: 1.0, intelligence: 1.0, willpower: 1.2 },
      'Cyborg': { strength: 1.4, intelligence: 1.1, willpower: 0.9 },
      'Archaeologist': { strength: 0.8, intelligence: 1.4, willpower: 1.0 }
    };

    const modifier = roleModifiers[role] || { strength: 1.0, intelligence: 1.0, willpower: 1.0 };

    const strength = this._generateStat(tier, 100, 250, modifier.strength);
    const intelligence = this._generateStat(tier, 100, 200, modifier.intelligence);
    const willpower = this._generateStat(tier, 100, 220, modifier.willpower);

    const baseStrength = strength;
    const baseIntelligence = intelligence;
    const baseWillpower = willpower;

    // Calculate bounty based on tier and stats
    const bountyBase = tier === 1 ? 10000 : tier === 2 ? 500000 : 5000000;
    const bountyMultiplier = (strength + intelligence + willpower) / 300;
    const totalBounty = Math.round(bountyBase * bountyMultiplier);

    // Loyalty starts at 50-100%
    const loyalty = 50 + Math.random() * 50;

    return {
      id: this._generateUUID(),
      name: this._randomName(tier),
      tier,
      role,
      strength,
      intelligence,
      willpower,
      baseStrength,
      baseIntelligence,
      baseWillpower,
      stamina: 300 + tier * 100,
      hasDevilFruit,
      devilFruit: hasDevilFruit ? this._randomDevilFruit(tier) : null,
      hasHaki,
      hakiType: hasHaki ? this._randomHaki() : null,
      bountyMultiplier: bountyMultiplier.toFixed(2),
      totalBounty,
      loyalty: Math.round(loyalty),
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Generate multiple characters
   * @param {number} count - Number of characters to generate
   * @param {number} tier - Character tier
   * @returns {Array} Array of generated characters
   */
  static generateCrew(count = 10, tier = 1) {
    const crew = [];
    for (let i = 0; i < count; i++) {
      crew.push(this.generateCharacter(tier));
    }
    return crew;
  }

  /**
   * Generate a stat with variance
   * @private
   */
  static _generateStat(tier, min, max, modifier = 1.0) {
    const tierMultiplier = 0.8 + tier * 0.2;
    const base = min + Math.random() * (max - min);
    const stat = base * tierMultiplier * modifier;
    return Math.round(stat);
  }

  /**
   * Random character name from pool
   * @private
   */
  static _randomName(tier) {
    const pool = this.NAMES[`tier${tier}`] || this.NAMES.tier1;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /**
   * Random Devil Fruit from tier pool
   * @private
   */
  static _randomDevilFruit(tier) {
    const pool = this.DEVIL_FRUITS[`tier${tier}`] || this.DEVIL_FRUITS.tier1;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /**
   * Random Haki type
   * @private
   */
  static _randomHaki() {
    return this.HAKI_TYPES[Math.floor(Math.random() * this.HAKI_TYPES.length)];
  }

  /**
   * Generate UUID v4
   * @private
   */
  static _generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0,
        v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Validate generated character
   * @static
   */
  static validateCharacter(char) {
    const errors = [];

    if (!char.name) errors.push('Missing name');
    if (![1, 2, 3].includes(char.tier)) errors.push('Invalid tier');
    if (!this.ROLES.includes(char.role)) errors.push('Invalid role');
    if (char.strength < 50 || char.strength > 350) errors.push('Invalid strength');
    if (char.intelligence < 50 || char.intelligence > 350) errors.push('Invalid intelligence');
    if (char.willpower < 50 || char.willpower > 350) errors.push('Invalid willpower');
    if (char.tier >= 3 && !char.hasHaki && Math.random() > 0.5) errors.push('Tier 3 should have Haki');

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get character tier by bounty
   * @static
   */
  static getTierByBounty(bounty) {
    if (bounty < 100000) return 1;
    if (bounty < 10000000) return 2;
    return 3;
  }

  /**
   * Get character stats summary
   * @static
   */
  static getCharacterSummary(character) {
    return {
      name: character.name,
      tier: character.tier,
      role: character.role,
      totalStats: character.strength + character.intelligence + character.willpower,
      bounty: character.totalBounty,
      hasDevilFruit: character.hasDevilFruit,
      hasHaki: character.hasHaki,
      loyalty: character.loyalty
    };
  }
}

module.exports = CharacterGenerator;
