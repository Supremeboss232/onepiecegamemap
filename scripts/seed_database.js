/**
 * Seed Database Script
 * Populates Supabase with comprehensive test data
 * Run: node scripts/seed_database.js
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

// Comprehensive node data with coordinates
const NODES = [
  // Four Blues
  { name: 'Shells Town', region: 'East Blue', x: 100, y: 100 },
  { name: 'Syrup Village', region: 'East Blue', x: 200, y: 100 },
  { name: 'Orange Town', region: 'East Blue', x: 150, y: 200 },
  { name: 'Baratie', region: 'East Blue', x: 300, y: 250 },
  { name: 'Arlong Park', region: 'East Blue', x: 400, y: 300 },
  
  // Grand Line entrance & early
  { name: 'Reverse Mountain', region: 'Grand Line', x: 500, y: 150 },
  { name: 'Loguetown', region: 'Grand Line', x: 600, y: 200 },
  { name: 'Whiskey Peak', region: 'Grand Line', x: 650, y: 350 },
  { name: 'Drum Island', region: 'Grand Line', x: 750, y: 400 },
  { name: 'Alabasta', region: 'Grand Line', x: 800, y: 500 },
  
  // Grand Line mid
  { name: 'Jaya', region: 'Grand Line', x: 900, y: 450 },
  { name: 'Water 7', region: 'Grand Line', x: 1000, y: 550 },
  { name: 'Enies Lobby', region: 'Grand Line', x: 1100, y: 600 },
  { name: 'Thriller Bark', region: 'Grand Line', x: 1200, y: 400 },
  { name: 'Sabaody Archipelago', region: 'Grand Line', x: 1300, y: 350 },
  
  // New World
  { name: 'Fish-Man Island', region: 'New World', x: 1700, y: 50 },
  { name: 'Dressrosa', region: 'New World', x: 1800, y: 200 },
  { name: 'Zou', region: 'New World', x: 1900, y: 400 },
  { name: 'Wano Country', region: 'New World', x: 2000, y: 500 },
  { name: 'Laugh Tale', region: 'New World', x: 2100, y: 600 },
];

// Connection network
const EDGES = [
  ['Shells Town', 'Syrup Village'],
  ['Syrup Village', 'Orange Town'],
  ['Orange Town', 'Baratie'],
  ['Baratie', 'Arlong Park'],
  ['Arlong Park', 'Reverse Mountain'],
  ['Reverse Mountain', 'Loguetown'],
  ['Loguetown', 'Whiskey Peak'],
  ['Whiskey Peak', 'Drum Island'],
  ['Drum Island', 'Alabasta'],
  ['Alabasta', 'Jaya'],
  ['Jaya', 'Water 7'],
  ['Water 7', 'Enies Lobby'],
  ['Enies Lobby', 'Thriller Bark'],
  ['Thriller Bark', 'Sabaody Archipelago'],
  ['Sabaody Archipelago', 'Fish-Man Island'],
  ['Fish-Man Island', 'Dressrosa'],
  ['Dressrosa', 'Zou'],
  ['Zou', 'Wano Country'],
  ['Wano Country', 'Laugh Tale'],
];

// Global unique characters
const GLOBAL_CHARACTERS = [
  { name: 'Roronoa Zoro', title: 'Swordsman', bounty_reward: 320000000, crew_archetype: 'Swordsman', current_status: 'Free_Agent' },
  { name: 'Nami', title: 'Navigator', bounty_reward: 350000000, crew_archetype: 'Navigator', current_status: 'Free_Agent' },
  { name: 'Usopp', title: 'Sniper', bounty_reward: 200000000, crew_archetype: 'Sharpshooter', current_status: 'Free_Agent' },
  { name: 'Sanji', title: 'Cook', bounty_reward: 330000000, crew_archetype: 'Martial Artist', current_status: 'Free_Agent' },
  { name: 'Nico Robin', title: 'Archaeologist', bounty_reward: 930000000, crew_archetype: 'Historian', current_status: 'Free_Agent' },
  { name: 'Franky', title: 'Shipwright', bounty_reward: 394000000, crew_archetype: 'Engineer', current_status: 'Free_Agent' },
  { name: 'Brook', title: 'Musician', bounty_reward: 383000000, crew_archetype: 'Musician', current_status: 'Free_Agent' },
  { name: 'Dracule Mihawk', title: 'Greatest Swordsman', bounty_reward: 3590000000, crew_archetype: 'Swordsman', current_status: 'Free_Agent' },
  { name: 'Boa Hancock', title: 'Empress', bounty_reward: 1659000000, crew_archetype: 'Captain', current_status: 'Free_Agent' },
  { name: 'Crocodile', title: 'Desert King', bounty_reward: 1965000000, crew_archetype: 'Warlord', current_status: 'Free_Agent' },
  { name: 'Buggy', title: 'Clown', bounty_reward: 3189000000, crew_archetype: 'Captain', current_status: 'Free_Agent' },
  { name: 'Kuma', title: 'Tyrant', bounty_reward: 2960000000, crew_archetype: 'Cyborg', current_status: 'Free_Agent' },
];

async function seedDatabase() {
  try {
    console.log('🚀 Starting database seeding...\n');

    // 1. Seed nodes
    console.log('📍 Seeding nodes...');
    const { data: nodeData, error: nodeError } = await supabaseAdmin
      .from('nodes')
      .insert(NODES)
      .select();

    if (nodeError) throw new Error(`Nodes: ${nodeError.message}`);
    console.log(`✅ Created ${nodeData.length} nodes`);

    // 2. Build node ID map
    const nodeMap = {};
    nodeData.forEach(node => { nodeMap[node.name] = node.id; });

    // 3. Seed edges
    console.log('🔗 Seeding edges...');
    const edgeInserts = EDGES.map(([from, to]) => ({
      from_node_id: nodeMap[from],
      to_node_id: nodeMap[to],
    }));

    const { data: edgeData, error: edgeError } = await supabaseAdmin
      .from('node_edges')
      .insert(edgeInserts)
      .select();

    if (edgeError) throw new Error(`Edges: ${edgeError.message}`);
    console.log(`✅ Created ${edgeData.length} edges`);

    // 4. Seed global characters
    console.log('🎭 Seeding global characters...');
    const { data: charData, error: charError } = await supabaseAdmin
      .from('global_characters')
      .insert(GLOBAL_CHARACTERS)
      .select();

    if (charError) throw new Error(`Characters: ${charError.message}`);
    console.log(`✅ Created ${charData.length} global characters`);

    // 5. Create test players
    console.log('👥 Seeding test players...');
    const testPlayers = [
      { username: 'LuffyGOL', title: 'King of Pirates', bounty: 3000000000, total_bounty: 3000000000, last_action: new Date().toISOString() },
      { username: 'ZoroSwordmaster', title: 'Greatest Swordsman', bounty: 320000000, total_bounty: 320000000, last_action: new Date().toISOString() },
      { username: 'NamiNavigator', title: 'Cartographer', bounty: 350000000, total_bounty: 350000000, last_action: new Date().toISOString() },
      { username: 'SanjiChef', title: 'Black Leg', bounty: 330000000, total_bounty: 330000000, last_action: new Date().toISOString() },
    ];

    const { data: playerData, error: playerError } = await supabaseAdmin
      .from('players')
      .insert(testPlayers)
      .select();

    if (playerError) throw new Error(`Players: ${playerError.message}`);
    console.log(`✅ Created ${playerData.length} test players`);

    // 6. Create test ships
    console.log('🚢 Seeding test ships...');
    const startNodeId = nodeMap['Shells Town'];
    const shipInserts = playerData.map((player, idx) => ({
      player_id: player.id,
      node_id: startNodeId,
      hull_integrity: 100,
    }));

    const { data: shipData, error: shipError } = await supabaseAdmin
      .from('ships')
      .insert(shipInserts)
      .select();

    if (shipError) throw new Error(`Ships: ${shipError.message}`);
    console.log(`✅ Created ${shipData.length} test ships`);

    // 7. Create Haki pools
    console.log('⚡ Seeding Haki pools...');
    const hakiInserts = playerData.map(player => ({
      owner_id: player.id,
      observation_haki: 0,
      armament_haki: 0,
      conqueror_haki: 0,
    }));

    const { data: hakiData, error: hakiError } = await supabaseAdmin
      .from('haki_pools')
      .insert(hakiInserts)
      .select();

    if (hakiError) throw new Error(`Haki: ${hakiError.message}`);
    console.log(`✅ Created ${hakiData.length} Haki pools\n`);

    console.log('✨ Seeding complete!\n');
    console.log('📊 Summary:');
    console.log(`   • Nodes: ${nodeData.length}`);
    console.log(`   • Edges: ${edgeData.length}`);
    console.log(`   • Characters: ${charData.length}`);
    console.log(`   • Players: ${playerData.length}`);
    console.log(`   • Ships: ${shipData.length}`);
    console.log(`   • Haki Pools: ${hakiData.length}\n`);

    console.log('Test player credentials:');
    playerData.forEach((p, i) => console.log(`   ${i + 1}. ${p.username}`));

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

seedDatabase();
