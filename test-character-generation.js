/**
 * Test Suite: Character Generation System
 * Tests the complete character generation flow
 */

const API_BASE = 'http://localhost:3000';

let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function to make requests
async function apiRequest(endpoint, method = 'GET', body = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, options);
  return {
    status: response.status,
    data: await response.json()
  };
}

// Test 1: Register and Login
async function testRegistrationAndLogin() {
  console.log('\n=== TEST 1: Registration & Login ===');
  
  const testUsername = `testuser_${Date.now()}`;
  
  // Register
  const registerRes = await apiRequest('/api/auth/register', 'POST', { username: testUsername });
  const testPassed = registerRes.status === 200 && registerRes.data.player_id && registerRes.data.token;
  
  logTest('Registration', testPassed, registerRes);
  
  if (testPassed) {
    return { playerId: registerRes.data.player_id, token: registerRes.data.token, username: testUsername };
  }
  return null;
}

// Test 2: Generate Crew - Basic
async function testGenerateCrewBasic(playerId, token) {
  console.log('\n=== TEST 2: Generate Crew (Tier 1, 5 Characters) ===');
  
  const res = await apiRequest(
    '/api/character/generate',
    'POST',
    { tier: 1, count: 5, playerId },
    token
  );

  const testPassed = res.status === 200 && res.data.success && res.data.crew && res.data.crew.length === 5;
  logTest('Generate Crew (Tier 1, Count 5)', testPassed, res);

  if (testPassed) {
    const crew = res.data.crew;
    console.log(`✓ Generated ${crew.length} characters`);
    crew.forEach((char, idx) => {
      console.log(`  [${idx + 1}] ${char.name} - ${char.role} (Tier ${char.tier})`);
      console.log(`      STR: ${char.strength}, INT: ${char.intelligence}, WIL: ${char.willpower}`);
      if (char.hasDevilFruit) console.log(`      Devil Fruit: ${char.devilFruit}`);
      if (char.hasHaki) console.log(`      Haki: ${char.hakiType}`);
      console.log(`      Loyalty: ${char.loyalty}%`);
    });
  }

  return testPassed;
}

// Test 3: Generate Crew - Tier 2
async function testGenerateCrewTier2(playerId, token) {
  console.log('\n=== TEST 3: Generate Crew (Tier 2, 10 Characters) ===');
  
  const res = await apiRequest(
    '/api/character/generate',
    'POST',
    { tier: 2, count: 10, playerId },
    token
  );

  const testPassed = res.status === 200 && res.data.success && res.data.crew && res.data.crew.length === 10;
  logTest('Generate Crew (Tier 2, Count 10)', testPassed, res);

  if (testPassed) {
    const crew = res.data.crew;
    const withDevilFruit = crew.filter(c => c.hasDevilFruit).length;
    console.log(`✓ ${withDevilFruit}/${crew.length} have Devil Fruits (expected ~20%)`);
  }

  return testPassed;
}

// Test 4: Generate Crew - Tier 3
async function testGenerateCrewTier3(playerId, token) {
  console.log('\n=== TEST 4: Generate Crew (Tier 3, 3 Characters) ===');
  
  const res = await apiRequest(
    '/api/character/generate',
    'POST',
    { tier: 3, count: 3, playerId },
    token
  );

  const testPassed = res.status === 200 && res.data.success && res.data.crew && res.data.crew.length === 3;
  logTest('Generate Crew (Tier 3, Count 3)', testPassed, res);

  if (testPassed) {
    const crew = res.data.crew;
    console.log(`✓ Generated Tier 3 characters:`);
    crew.forEach((char, idx) => {
      console.log(`  [${idx + 1}] ${char.name} - Bounty: ${char.totalBounty.toLocaleString()}`);
      if (char.hasHaki) {
        console.log(`      ⭐ Has ${char.hakiType} Haki`);
      }
    });
  }

  return testPassed;
}

// Test 5: Character Validation
async function testCharacterValidation(playerId, token) {
  console.log('\n=== TEST 5: Character Validation ===');
  
  const res = await apiRequest(
    '/api/character/generate',
    'POST',
    { tier: 2, count: 5, playerId },
    token
  );

  let allValid = true;
  if (res.status === 200 && res.data.crew) {
    res.data.crew.forEach(char => {
      // Check stat ranges
      const statsValid = 
        char.strength >= 50 && char.strength <= 400 &&
        char.intelligence >= 50 && char.intelligence <= 400 &&
        char.willpower >= 50 && char.willpower <= 400;
      
      // Check tier
      const tierValid = [1, 2, 3].includes(char.tier);
      
      // Check role
      const validRoles = ['Swordsman', 'Navigator', 'Doctor', 'Cook', 'Sniper', 'Musician', 'Cyborg', 'Archaeologist'];
      const roleValid = validRoles.includes(char.role);

      if (!statsValid || !tierValid || !roleValid) {
        allValid = false;
        console.log(`✗ Validation failed for ${char.name}`);
      }
    });
  } else {
    allValid = false;
  }

  logTest('Character Validation', allValid, { validCharacters: res.data.crew?.length });
  return allValid;
}

// Test 6: Invalid Input Handling
async function testInvalidInput(playerId, token) {
  console.log('\n=== TEST 6: Invalid Input Handling ===');

  // Test invalid tier
  const invalidTier = await apiRequest(
    '/api/character/generate',
    'POST',
    { tier: 5, count: 5, playerId },
    token
  );

  const tierTestPassed = invalidTier.status === 400;
  logTest('Reject Invalid Tier', tierTestPassed, invalidTier);

  // Test invalid count
  const invalidCount = await apiRequest(
    '/api/character/generate',
    'POST',
    { tier: 1, count: 100, playerId },
    token
  );

  const countTestPassed = invalidCount.status === 400;
  logTest('Reject Invalid Count', countTestPassed, invalidCount);

  // Test missing playerId
  const missingPlayerId = await apiRequest(
    '/api/character/generate',
    'POST',
    { tier: 1, count: 5 },
    token
  );

  const playerIdTestPassed = missingPlayerId.status === 400;
  logTest('Reject Missing PlayerId', playerIdTestPassed, missingPlayerId);

  return tierTestPassed && countTestPassed && playerIdTestPassed;
}

// Test 7: Generation Uniqueness
async function testGenerationUniqueness(playerId, token) {
  console.log('\n=== TEST 7: Generation Uniqueness ===');

  const res1 = await apiRequest(
    '/api/character/generate',
    'POST',
    { tier: 1, count: 5, playerId },
    token
  );

  const res2 = await apiRequest(
    '/api/character/generate',
    'POST',
    { tier: 1, count: 5, playerId },
    token
  );

  if (res1.status === 200 && res2.status === 200) {
    const crew1 = res1.data.crew;
    const crew2 = res2.data.crew;

    // Check if at least some characters are different (not deterministic)
    const allSame = crew1.every((c1, idx) => c1.name === crew2[idx].name);
    const testPassed = !allSame; // Should NOT all be the same

    logTest('Generation Produces Different Results', testPassed, { 
      allIdentical: allSame 
    });

    return testPassed;
  }

  logTest('Generation Produces Different Results', false, res1);
  return false;
}

// Utility function to log test results
function logTest(testName, passed, details) {
  if (passed) {
    testResults.passed++;
    console.log(`✓ PASS: ${testName}`);
  } else {
    testResults.failed++;
    console.log(`✗ FAIL: ${testName}`);
  }
  testResults.tests.push({ testName, passed, details });
}

// Main test runner
async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║        CHARACTER GENERATION SYSTEM TEST SUITE              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    // Register and get auth
    const auth = await testRegistrationAndLogin();
    if (!auth) {
      console.log('\n✗ CRITICAL: Registration failed, cannot run other tests');
      return;
    }

    const { playerId, token } = auth;

    // Run all tests
    await testGenerateCrewBasic(playerId, token);
    await testGenerateCrewTier2(playerId, token);
    await testGenerateCrewTier3(playerId, token);
    await testCharacterValidation(playerId, token);
    await testInvalidInput(playerId, token);
    await testGenerationUniqueness(playerId, token);

  } catch (error) {
    console.error('\n✗ CRITICAL ERROR:', error);
    testResults.failed++;
  }

  // Print summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                      TEST SUMMARY                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`✓ Passed: ${testResults.passed}`);
  console.log(`✗ Failed: ${testResults.failed}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Total: ${testResults.passed + testResults.failed} tests`);
  console.log(`Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);

  if (testResults.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Character generation system is working correctly.');
  } else {
    console.log(`\n⚠️  ${testResults.failed} test(s) failed. Review the output above.`);
  }
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runAllTests().catch(console.error);
}

// Also export for use in browsers
if (typeof window !== 'undefined') {
  window.runCharacterGenerationTests = runAllTests;
  console.log('Character generation tests loaded. Run: runCharacterGenerationTests()');
}
