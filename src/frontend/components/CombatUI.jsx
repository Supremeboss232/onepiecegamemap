import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';

export function CombatUI({ 
  playerState,
  playerId,
  activeCombat,
  apiBase, 
  token,
  onCombatEnd
}) {
  const [selectedHaki, setSelectedHaki] = useState('Armament');
  const [combatLog, setCombatLog] = useState([]);
  const [staminaAlert, setStaminaAlert] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);

  const hakiTypes = ['Observation', 'Armament', 'Conqueror'];
  const currentStamina = activeCombat?.player_stamina || 100;
  const opponentStamina = activeCombat?.opponent_stamina || 100;
  const playerHealth = activeCombat?.player_health || 100;
  const opponentHealth = activeCombat?.opponent_health || 100;

  const staminaRequiredForAttack = 20;

  useEffect(() => {
    if (currentStamina < staminaRequiredForAttack) {
      setStaminaAlert(true);
    } else {
      setStaminaAlert(false);
    }
  }, [currentStamina]);

  const executeAttack = async () => {
    if (currentStamina < staminaRequiredForAttack) {
      addCombatLog('⚠️ Insufficient stamina!', 'error');
      return;
    }

    if (!activeCombat?.id || !playerId) {
      addCombatLog('❌ Combat session error', 'error');
      return;
    }

    try {
      setActionInProgress(true);
      const result = await apiClient.executeCombatAction(
        activeCombat.id,
        playerId,
        selectedHaki,
        staminaRequiredForAttack
      );

      if (!result.success) {
        addCombatLog(`❌ ${result.error}`, 'error');
        return;
      }

      const data = result.data;
      let effectiveness = 'Normal';
      if (data.haki_effectiveness === 'super-effective') {
        effectiveness = '⭐ Super Effective';
      } else if (data.haki_effectiveness === 'not-effective') {
        effectiveness = '❌ Not Effective';
      }

      addCombatLog(
        `${selectedHaki} Haki Attack! Damage: ${data.damage} (${effectiveness})`,
        'success'
      );
    } catch (err) {
      console.error('Combat error:', err);
      addCombatLog('❌ Error executing attack', 'error');
    } finally {
      setActionInProgress(false);
    }
  };

  const defend = async () => {
    if (!activeCombat?.id || !playerId) {
      addCombatLog('❌ Combat session error', 'error');
      return;
    }

    try {
      setActionInProgress(true);
      // Defense uses 50 stamina and reduces damage by 50%
      const result = await apiClient.executeCombatAction(
        activeCombat.id,
        playerId,
        'Defend',
        50
      );

      if (!result.success) {
        addCombatLog(`❌ ${result.error}`, 'error');
        return;
      }

      addCombatLog('🛡️ Defensive Stance! Reduced damage by 50%', 'neutral');
    } catch (err) {
      console.error('Defense error:', err);
      addCombatLog('❌ Error defending', 'error');
    } finally {
      setActionInProgress(false);
    }
  };

  const flee = async () => {
    try {
      setActionInProgress(true);
      // 50% chance to escape
      const escaped = Math.random() > 0.5;
      if (escaped) {
        addCombatLog('🏃 Escaped from combat!', 'success');
        setTimeout(() => {
          onCombatEnd?.();
        }, 1000);
      } else {
        addCombatLog('❌ Failed to escape! Take damage.', 'error');
      }
    } finally {
      setActionInProgress(false);
    }
  };

  const addCombatLog = (message, type = 'neutral') => {
    const entry = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    setCombatLog(prev => [entry, ...prev].slice(0, 20));
  };

  if (!activeCombat) {
    return null;
  }

  const hakiEffectiveness = {
    'Observation': activeCombat.opponent_haki === 'Conqueror' ? 'Strong' : 'Normal',
    'Armament': activeCombat.opponent_haki === 'Observation' ? 'Strong' : 'Normal',
    'Conqueror': activeCombat.opponent_haki === 'Armament' ? 'Strong' : 'Normal'
  };

  return (
    <div className="combat-ui">
      <div className="combat-header">
        <h2>⚔️ Combat</h2>
        <button className="close-combat" onClick={onCombatEnd}>✕</button>
      </div>

      <div className="combat-field">
        {/* Player Side */}
        <div className="combat-side player-side">
          <div className="fighter-info">
            <h3>You</h3>
            <div className="health-bar">
              <div 
                className="health-fill" 
                style={{ width: `${Math.max(0, playerHealth)}%` }}
              ></div>
              <span className="health-text">{Math.max(0, playerHealth)}/100</span>
            </div>
            <div className="stamina-bar">
              <div 
                className={`stamina-fill ${staminaAlert ? 'low' : ''}`}
                style={{ width: `${Math.max(0, currentStamina)}%` }}
              ></div>
              <span className="stamina-text">{Math.max(0, currentStamina)}/100</span>
            </div>
            <div className="haki-display">
              <span className="label">Active Haki:</span>
              <span className="current-haki">{activeCombat.player_haki_type || 'None'}</span>
            </div>
          </div>
        </div>

        {/* VS */}
        <div className="combat-vs">VS</div>

        {/* Opponent Side */}
        <div className="combat-side opponent-side">
          <div className="fighter-info">
            <h3>{activeCombat.opponent_name || 'Enemy'}</h3>
            <div className="health-bar">
              <div 
                className="health-fill opponent" 
                style={{ width: `${Math.max(0, opponentHealth)}%` }}
              ></div>
              <span className="health-text">{Math.max(0, opponentHealth)}/100</span>
            </div>
            <div className="stamina-bar">
              <div 
                className="stamina-fill opponent"
                style={{ width: `${Math.max(0, opponentStamina)}%` }}
              ></div>
              <span className="stamina-text">{Math.max(0, opponentStamina)}/100</span>
            </div>
            <div className="haki-display">
              <span className="label">Active Haki:</span>
              <span className="current-haki">{activeCombat.opponent_haki_type || 'None'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Haki Selection */}
      <div className="haki-selection">
        <h4>Choose Your Haki</h4>
        <div className="haki-buttons">
          {hakiTypes.map(haki => (
            <button
              key={haki}
              className={`haki-btn ${selectedHaki === haki ? 'selected' : ''} ${hakiEffectiveness[haki] === 'Strong' ? 'super-effective' : ''}`}
              onClick={() => setSelectedHaki(haki)}
              disabled={currentStamina < staminarequiredForAttack}
              title={`${haki}: ${hakiEffectiveness[haki]}`}
            >
              <span className="haki-name">{haki}</span>
              <span className="effectiveness">
                {hakiEffectiveness[haki] === 'Strong' && '⭐ Strong'}
                {hakiEffectiveness[haki] === 'Normal' && 'Normal'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="combat-actions">
        <button 
          className="action-btn attack"
          onClick={executeAttack}
          disabled={currentStamina < staminaRequiredForAttack || actionInProgress}
          title={`⚔️ Attack (costs ${staminaRequiredForAttack} stamina)`}
        >
          {actionInProgress ? '⏳ Processing...' : '⚔️ Attack'}
        </button>
        <button 
          className="action-btn defend"
          onClick={defend}
          disabled={actionInProgress}
          title="🛡️ Reduce incoming damage by 50%"
        >
          {actionInProgress ? '⏳ Processing...' : '🛡️ Defend'}
        </button>
        <button 
          className="action-btn flee"
          onClick={flee}
          disabled={actionInProgress}
          title="🏃 Attempt to escape (50% success rate)"
        >
          {actionInProgress ? '⏳ Processing...' : '🏃 Flee'}
        </button>
      </div>

      {/* Combat Log */}
      <div className="combat-log">
        <h4>Combat Log</h4>
        <div className="log-entries">
          {combatLog.length > 0 ? (
            combatLog.map(entry => (
              <div key={entry.id} className={`log-entry ${entry.type}`}>
                <span className="time">{entry.timestamp.toLocaleTimeString()}</span>
                <span className="message">{entry.message}</span>
              </div>
            ))
          ) : (
            <p>Combat started!</p>
          )}
        </div>
      </div>
    </div>
  );
}
