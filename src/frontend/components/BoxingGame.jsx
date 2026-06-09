import React, { useState, useEffect } from 'react';

export function BoxingGame({ onGameEnd, playerId, token }) {
  const [gameActive, setGameActive] = useState(true);
  const [result, setResult] = useState(null);
  const [playerStamina, setPlayerStamina] = useState(50);
  const [opponentHealth, setOpponentHealth] = useState(100);
  const [damageDealt, setDamageDealt] = useState(0);
  const [round, setRound] = useState(1);
  const [message, setMessage] = useState('Ready to fight!');
  const [clickCount, setClickCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45); // 45 second game

  useEffect(() => {
    if (!gameActive) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameActive]);

  // Opponent attacks randomly
  useEffect(() => {
    if (!gameActive || opponentHealth <= 0) return;

    const attackInterval = setInterval(() => {
      const damage = Math.floor(Math.random() * 15) + 5;
      setPlayerStamina((prev) => Math.max(0, prev - damage));
      setMessage(`Opponent hit! -${damage} stamina`);

      if (playerStamina <= 0) {
        setGameActive(false);
        endGame();
      }
    }, 3000);

    return () => clearInterval(attackInterval);
  }, [gameActive, playerStamina, opponentHealth]);

  const handlePunch = () => {
    if (!gameActive || playerStamina <= 10) return;

    setClickCount((prev) => prev + 1);
    
    // Build up damage with consecutive clicks
    const damage = Math.floor(5 + clickCount * 0.5);
    const staminaCost = Math.floor(8 + clickCount * 0.3);

    setOpponentHealth((prev) => {
      const newHealth = Math.max(0, prev - damage);
      if (newHealth <= 0) {
        setGameActive(false);
        endGame(true, damageDealt + damage);
      }
      return newHealth;
    });

    setDamageDealt((prev) => prev + damage);
    setPlayerStamina((prev) => Math.max(0, prev - staminaCost));
    setMessage(`💥 Punch! +${damage} damage (${clickCount} combo)`);

    // Reset combo after 1 second of not clicking
    setTimeout(() => {
      setClickCount(0);
    }, 1000);
  };

  const handleBlock = () => {
    if (!gameActive || playerStamina <= 5) return;

    setPlayerStamina((prev) => Math.max(0, prev - 5));
    setMessage('🛡️ Blocking!');
  };

  const endGame = (won = false, totalDamage = damageDealt) => {
    const bounty = won ? Math.floor(20000 + totalDamage * 50) : 5000;
    const resultMsg = won ? `🥊 Victory! KO opponent with ${totalDamage} damage!` : `💢 Defeat! Opponent was too strong.`;
    
    setResult({
      success: won,
      bounty,
      message: resultMsg
    });
  };

  if (result) {
    return (
      <div className="game-result">
        <h3>{result.message}</h3>
        <p className="bounty">💰 +{result.bounty} Bounty</p>
        <button onClick={() => onGameEnd(result)}>Next Game</button>
      </div>
    );
  }

  return (
    <div className="boxing-game">
      <div className="game-header">
        <h3>🥊 Boxing Match</h3>
        <div className="timer">⏱️ {timeLeft}s</div>
      </div>

      <div className="boxing-arena">
        <div className="fighter-section player">
          <div className="fighter-name">You</div>
          <div className="health-bar">
            <div className="health-fill" style={{ width: `${playerStamina}%` }}></div>
          </div>
          <div className="health-text">{playerStamina}% Stamina</div>
        </div>

        <div className="vs-text">VS</div>

        <div className="fighter-section opponent">
          <div className="fighter-name">Opponent</div>
          <div className="health-bar">
            <div className="health-fill" style={{ width: `${opponentHealth}%`, backgroundColor: '#ff6b6b' }}></div>
          </div>
          <div className="health-text">{opponentHealth}% Health</div>
        </div>
      </div>

      <div className="message-box">{message}</div>
      <div className="damage-counter">Total Damage: {damageDealt}</div>

      {gameActive && (
        <div className="action-buttons">
          <button
            className="punch-btn"
            onClick={handlePunch}
            disabled={playerStamina <= 10}
          >
            💥 Punch ({clickCount} combo)
          </button>
          <button
            className="block-btn"
            onClick={handleBlock}
            disabled={playerStamina <= 5}
          >
            🛡️ Block
          </button>
        </div>
      )}
    </div>
  );
}

export default BoxingGame;
