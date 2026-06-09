import React, { useState, useEffect } from 'react';

export function TreasureHuntGame({ onGameEnd, playerId, token }) {
  const [gameActive, setGameActive] = useState(true);
  const [result, setResult] = useState(null);
  const [treasures, setTreasures] = useState([]);
  const [found, setFound] = useState(new Set());
  const [timeLeft, setTimeLeft] = useState(45); // 45 second game
  const [hint, setHint] = useState('');

  useEffect(() => {
    // Generate treasure locations (hidden items on a grid)
    const newTreasures = Array.from({ length: 12 }, (_, idx) => ({
      id: idx,
      x: Math.floor(Math.random() * 6),
      y: Math.floor(Math.random() * 4),
      found: false,
      proximity: 0
    }));
    setTreasures(newTreasures);
  }, []);

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

  const handleSearch = (x, y) => {
    if (!gameActive) return;

    let foundTreasure = false;
    let newHint = '';

    setTreasures((prevTreasures) => {
      return prevTreasures.map((treasure) => {
        if (!found.has(treasure.id)) {
          const dx = Math.abs(treasure.x - x);
          const dy = Math.abs(treasure.y - y);
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance === 0) {
            // Found treasure!
            setFound((prev) => {
              const newFound = new Set(prev);
              newFound.add(treasure.id);
              if (newFound.size >= treasures.length) {
                endGame(true);
              }
              return newFound;
            });
            foundTreasure = true;
            newHint = '🎉 Found treasure!';
          } else if (distance < 1.5) {
            newHint = '🔥 Extremely hot! Treasure very close!';
          } else if (distance < 2.5) {
            newHint = '🌡️ Hot! Getting close!';
          } else if (distance < 3.5) {
            newHint = '🧊 Warm - you\'re in the area';
          } else {
            newHint = '❄️ Cold - keep searching';
          }
        }
        return treasure;
      });
    });

    if (newHint) setHint(newHint);
  };

  const endGame = (won = false) => {
    const foundCount = found.size;
    const bounty = won ? 25000 : Math.floor(8000 + foundCount * 1000);
    const message = won ? `🏴‍☠️ All treasures found! Perfect score!` : `⛏️ Found ${foundCount}/12 treasures`;

    setResult({
      success: won,
      bounty,
      message
    });
    setGameActive(false);
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
    <div className="treasure-hunt-game">
      <div className="game-header">
        <h3>⛏️ Treasure Hunt</h3>
        <div className="timer">⏱️ {timeLeft}s</div>
      </div>

      <div className="hunt-info">
        <p className="found-count">Found: {found.size}/12 treasures</p>
        <p className="hint-text">{hint || 'Click tiles to search for treasure!'}</p>
      </div>

      <div className="treasure-grid">
        {Array.from({ length: 24 }, (_, idx) => {
          const x = idx % 6;
          const y = Math.floor(idx / 6);
          const treasure = treasures.find((t) => t.x === x && t.y === y);
          const isTreasureHere = treasure && found.has(treasure.id);

          return (
            <div
              key={idx}
              className={`grid-cell ${isTreasureHere ? 'found' : ''}`}
              onClick={() => {
                if (gameActive) handleSearch(x, y);
              }}
            >
              {isTreasureHere ? '💎' : '?'}
            </div>
          );
        })}
      </div>

      {gameActive && (
        <p className="instructions">Click grid tiles to search for hidden treasure!</p>
      )}
    </div>
  );
}

export default TreasureHuntGame;
