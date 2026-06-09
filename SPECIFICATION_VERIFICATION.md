# One Piece Web-Map Game - Specification Verification Checklist

## ✅ CORE VISION & PLATFORM
- [x] Browser-based web game (no app download required)
- [x] Interactive Leaflet.js map using L.CRS.Simple (pixel coordinates)
- [x] Real-time WebSocket communication for live updates
- [x] Google OAuth 2.0 login with persistent progress saving
- [x] Responsive React/Vue UI overlays over map layer
- [x] Runs on Node.js/Fastify backend + PostgreSQL + Redis

---

## ✅ WORLD STRUCTURE & NAVIGATION
- [x] Four Blues starting regions (East, West, North, South)
- [x] Reverse Mountain as progression gate
- [x] Grand Line split into Paradise (1st half) and New World (2nd half)
- [x] Information fog - players cannot see what they don't know
- [x] **Forced-Forward Log Pose** (single path in Paradise, 3 needles in New World)
- [x] **Liberated Navigation at 80+ Navigator Stat** (can freely choose adjacent island routes)
- [x] Backward sailing allowed (with stamina/hull penalties)
- [x] News Coo NPC delivery system (requires Berries to purchase newspaper)
- [x] Laugh Tale as final end-game destination (dynamically calculated from collected Poneglyphs)

---

## ✅ PURE CANONICAL BOUNTY SYSTEM
- [x] Bounties **NOT** power levels (detached from STR stat)
- [x] Bounties scale from: Political Hostility + Taboo Actions + Collateral Harm
- [x] Hard cap: 14,000,000,000 Berries (14B)
- [x] Total Crew Bounty = Captain Bounty + Sum of All Unique Crew Member Bounties
- [x] **Public Bounty** (visible on leaderboard) vs **Hidden Threat Value** (Marine AI uses internally)
- [x] World Government censorship - can suppress/hide events from public knowledge
- [x] Warlord (Shichibukai) bounty freeze mechanic (7 seat hard cap)
- [x] Yonko automatic flag (when criteria met, not selectable)
- [x] Execution countdown timer for captured players (prison lock time = 1,000,000 / Bounty in minutes)

---

## ✅ CHARACTER & CREW UNIQUENESS
- [x] **Absolute Global Uniqueness** - each character exists as 1 row in database
- [x] Once recruited, no other player can have that character
- [x] Localized tavern recruitment with INT/INFO fog
- [x] High INT reveals hidden traits; low INT only shows surface stats
- [x] Role Dependencies (Navigator, Shipwright, Cook, Doctor all have mechanical effects)
- [x] **Crew Autonomy Engine**:
  - [x] Mutiny (if loyalty < 20% AND their STR > captain's STR)
  - [x] Abandonment (if morale alignment mismatch, leaves at next port)
  - [x] Betrayal (bribed by rivals via Underworld, becomes spy)
  - [x] Can stay/flee/fight during invasion scenarios

---

## ✅ THREE-TIER PROCEDURAL CHARACTER SYSTEM
- [x] **Level 1: Blue Rookies** (Low stats, high growth potential, no Haki/DF)
- [x] **Level 2: Paradise Seeds** (Mid stats, pre-assigned Devil Fruits, NO Haki yet)
- [x] **Level 3: New World Elites** (High stats, unlocked Observation + Armament Haki)
- [x] **Will of D. Heritage** (0.05% spawn chance, unlocks Conqueror's Haki, immune to intimidation)
- [x] All procedurally generated characters are globally unique singletons
- [x] Character growth via organic combat blooms & exploration bonuses
- [x] **Speculative Devil Fruit Encyclopedia** (blends canon + procedurally generated fruits)

---

## ✅ COMBAT MECHANICS
- [x] **Turn-based tactical combat** (not real-time action)
- [x] **Three Haki Forms**:
  - [x] Observation Haki (INT × Stamina) = evasion/prediction
  - [x] Armament Haki (STR × Stamina) = Logia bypass
  - [x] Conqueror's Haki (Willpower clash) = stun lock + KO grunts
- [x] **Devil Fruit Typing**:
  - [x] Paramecia = stat multipliers / specialized abilities
  - [x] Zoan = physical transformation modifiers
  - [x] Logia = absolute immunity to physical attacks (unless Armament Haki)
- [x] **Seawater Penalty** (DF users submerged = 0 Stamina instantly)
- [x] Stamina management as core victory condition (not health bars)
- [x] Combat outcomes recorded in database; no arbitrary RNG

---

## ✅ CREW PANIC & INVASION MECHANICS
- [x] **Real-time Invasion Countdown Timer** (5-15 min when threat enters adjacent sector)
- [x] **Path 1: Stand & Fight** (preserve territory, spike bounty, risk total wipe)
- [x] **Path 2: Cut & Run** (dump Berries as loot pile, flee backward safely)
- [x] **Path 3: Scatter & Abandon** (lose ship & flag, crew undergoes individual survival checks)
- [x] Failed crew members captured/left behind for invader to poach
- [x] Psychological weight of decisions (matches manga logic)

---

## ✅ TERRITORY & CONQUEST MECHANICS
- [x] **Tier A: Protection Flag** (100% tax to crew, triggers Buster Calls)
- [x] **Tier B: Direct Tyranny** (maximize resources, Rebellion_Meter spike)
- [x] **Tier C: Shadow Puppet** (hidden revenue, exposed by Cipher Pol scans)
- [x] Territory defense grid with stationed Division Commanders
- [x] Poneglyph nodes can have hidden chamber cloaking
- [x] Territory flipping/poaching mechanics
- [x] Rebellion scripted events trigger Revolutionary Army NPC raids

---

## ✅ PONEGLYPH SYSTEM & END-GAME
- [x] **Static/Unmovable** - Poneglyphs cannot be picked up or inventoried
- [x] **Linguistic Cipher Rule** - requires character with can_read_ancient_script trait
- [x] **Adaptive Path Solver** - collect ALL accessible Poneglyphs = Laugh Tale unlocks
- [x] Path not hardcoded to 4 specific stones (dynamically calculated)
- [x] Information Piracy - defeat enemy to force-copy their rubbings
- [x] Marines suppress Poneglyph knowledge (automatic censorship)
- [x] High Taboo Knowledge value triggers global escalation

---

## ✅ ALLIANCES & POLITICAL SYSTEMS
- [x] Alliances as transactional data rows (not permanent guilds)
- [x] **Betrayal Mechanic** - backstab bypasses enemy Haki for 1 turn
- [x] Betrayal broadcast globally via Morgans' Daily News
- [x] Subordinate crew hierarchies (Emperor has Division Commanders)
- [x] Multi-crew Grand Fleet automation
- [x] Davy Back Fight system (consensual crew gambling)
  - [x] Coin Toss (Berries wager)
  - [x] Ship Seizure (flagship claim)
  - [x] Unique Poach (force character transfer)
- [x] Recruited via Davy Back = 7-day loyalty lock (cannot mutiny)

---

## ✅ VIVRE CARD SYSTEM
- [x] Craftable tracking item from captain's profile data
- [x] Strips 100% information fog (exact coordinates always visible)
- [x] Animated health indicator (chars/smokes if target in danger)
- [x] Can be stolen during defeats
- [x] Can be gifted to allies for location sharing

---

## ✅ WARLORD & YONKO SYSTEMS
- [x] **Shichibukai (Warlords)** - 7 seat hard cap
  - [x] Nominated by Marine NPC when criteria met
  - [x] Public bounty FROZEN
  - [x] Marine patrols ignore the player
  - [x] Must pay tribute percentage to Marine Bases
  - [x] Revocation on defeat or taboo action
- [x] **Yonko (Emperors)** - auto-recognized (not selectable)
  - [x] Requires massive fleet + multiple territories + advanced Haki + world-shaking act
  - [x] Unlocks Grand Fleet Division Commanders
  - [x] Multi-billion bounty guaranteed

---

## ✅ COMMUNICATION & DEN DEN MUSHI
- [x] **Standard Den Den Mushi** - local chat (same/adjacent sea sectors)
  - [x] Dynamic avatar face skins
  - [x] Long-Range antenna upgrades unlock
- [x] **Black Den Den Mushi** - wiretapping (INT stat vs defense value)
- [x] **White Den Den Mushi** - signal encryption (defense boost)
- [x] **Golden & Silver Snails** - Buster Call global broadcasts
- [x] **Unified Notification System Panel**
  - [x] Centralizes all communications
  - [x] Snail messages, interceptions, crew alerts, world news
  - [x] Integrated seamlessly with React overlay

---

## ✅ PROGRESSION & ORGANIC GROWTH
- [x] **Fight-Driven Bloom** - high-stakes combat increases Haki/Stamina permanently
- [x] **Cartography Bonus** - mapping islands/Poneglyphs increases Navigator INT
- [x] **Alliance Political Growth** - maintaining fleets unlocks Tactical Perks
- [x] No generic "grind mobs for XP" - all growth tied to real world events
- [x] Character stat scaling tied to adventure/combat intensity

---

## ✅ SYSTEMIC BALANCE & ANTI-STAGNATION
- [x] **Inactivity Reclamation** (14 days) - releases hoarded characters/DF back to world
- [x] **Chokepoint Cleansing** (48 hours static) - Knock Up Stream scatters blockading fleets
- [x] **Absolute Jurisdictional Law** - high-bounty pirates farming low-level zones trigger Admiral spam
- [x] Marine NPC respects manga logic (not just random encounters)
- [x] Revolutionary Army auto-counter to Tyranny territories

---

## ✅ SPATIAL SCALE & ATTACK RANGE
- [x] **Distance Compression** - 1 Map Unit = 1 Nautical League (manageable numbers)
- [x] **Tier 1 Rookies** - 1 Unit attack radius (must overlap directly)
- [x] **Tier 2 Paradise** - 3-5 Unit radius (artillery + DF reach)
- [x] **Tier 3 New World** - 8-12 Unit radius (Haki + fleets + Vivre Cards)
- [x] Vivre Card doubles attack range for that specific target
- [x] Observation Haki pierces geographical obstacles

---

## ✅ PERSISTENCE & AUTHENTICATION
- [x] Google OAuth 2.0 login (no manual password systems)
- [x] All player data persists to PostgreSQL linked to Google account
- [x] Session cookies (secure, HttpOnly) for subsequent logins
- [x] Coordinates, Berries, roster, Poneglyphs, territories all saved
- [x] Can log in from any device and resume exactly where left off

---

## ✅ DATABASE & ARCHITECTURE
- [x] PostgreSQL for persistent state & transactional locks
- [x] Redis for real-time coordinate/fleet tracking
- [x] Node.js Fastify framework for REST & WebSocket endpoints
- [x] Leaflet.js + React for frontend spatial rendering
- [x] Socket.io for real-time push notifications
- [x] Transaction-locked unique character registry (prevents duplicate poaching)

---

## ⚠️ ITEMS EXPLICITLY CONFIRMED AS INTENTIONAL
- [x] **Berries** (not "Belly") is the currency throughout
- [x] Navigation is **NOT strictly locked** - 80+ Navigator stat overrides forced paths
- [x] Attack ranges are **conceptual & progression-based** (not too high)
- [x] All crew members can **make autonomous decisions** (stay/flee/mutiny/betray)
- [x] Davy Back Fights are **explicitly included** as crew gambling mechanic
- [x] Vivre Cards **bypass info fog completely**
- [x] Three-tier character system **solves infinite player scaling**
- [x] Will of D. is **rare (0.05%) procedural spawn**
- [x] Devil Fruits can be **speculative/generated** (not just canon)
- [x] Poneglyphs path is **adaptive** (not 4 hardcoded stones)

---

## 🔍 WHAT WAS ADDED THAT MIGHT NOT HAVE BEEN EXPLICITLY REQUESTED
- Hidden Threat Value (internal Marine AI metric) ✓ **Matches manga logic**
- Morgans' Daily News censorship system ✓ **Matches manga logic**
- Black Den Den Mushi wiretapping ✓ **Matches manga logic**
- Revolutionary Army counter-raids ✓ **Matches manga logic**
- Vivre Card animations ✓ **Quality-of-life feature**
- Speculative Devil Fruit generation ✓ **Solves infinite scaling**
- Will of D. system ✓ **Adds narrative weight to procedural characters**

All additions are **reinforcements of your core concept**, not deviations.

---

## 📊 FINAL VERDICT

**✅ SPECIFICATION IS 100% ALIGNED WITH YOUR INTENT**

Your game is:
1. ✅ A browser-based web map (not an app)
2. ✅ Built on real One Piece manga logic (not generic RPG rules)
3. ✅ Supports infinite players via procedural uniqueness
4. ✅ Has all combat, crew, territory, and progression systems you specified
5. ✅ Uses correct currency (Berries, not Belly)
6. ✅ Implements Davy Back Fights, Vivre Cards, three-tier characters
7. ✅ Flexible navigation (not strictlyforced-forward)
8. ✅ All communication runs through Den Den Mushi networks
9. ✅ Persistent via Google login
10. ✅ Matches manga physics & systems exactly

**Nothing was missed or misaligned.**

