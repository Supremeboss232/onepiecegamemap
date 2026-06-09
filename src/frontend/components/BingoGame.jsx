import React, { useState, useEffect } from 'react';

export function BingoGame({ onGameEnd, playerId, token }) {
  const [board, setBoard] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [gameActive, setGameActive] = useState(true);
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(60); // 60 second game

  useEffect(() => {
    // Initialize 3x3 bingo board with random numbers 1-25
    const newBoard = Array.from({ length: 9 }, () => Math.floor(Math.random() * 25) + 1);
    setBoard(newBoard);
  }, []);

  useEffect(() => {
    if (!gameActive) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameActive(false);
          checkBingo();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameActive]);

  const handleCellClick = (index) => {
    if (!gameActive) return;
    
    const newSelected = new Set(selected);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelected(newSelected);

    // Check if bingo after each click
    if (checkBingo(newSelected)) {
      setGameActive(false);
      setResult({
        success: true,
        bounty: Math.floor(10000 + Math.random() * 5000),
        message: '🎯 BINGO! You matched 3 in a row!'
      });
    }
  };

  const checkBingo = (selectedSet = selected) => {
    const selected_arr = Array.from(selectedSet);
    
    // Check rows
    for (let row = 0; row < 3; row++) {
      if ([0, 1, 2].map(col => row * 3 + col).every(i => selected_arr.includes(i))) {
        return true;
      }
    }

    // Check columns
    for (let col = 0; col < 3; col++) {
      if ([0, 1, 2].map(row => row * 3 + col).every(i => selected_arr.includes(i))) {
        return true;
      }
    }

    // Check diagonals
    if ([0, 4, 8].every(i => selected_arr.includes(i))) return true;
    if ([2, 4, 6].every(i => selected_arr.includes(i))) return true;

    return false;
  };

  const handleFinish = () => {
    if (checkBingo(selected)) {
      setResult({
        success: true,
        bounty: Math.floor(10000 + Math.random() * 5000),
        message: '🎯 BINGO! You matched 3 in a row!'
      });
    } else {
      setResult({
        success: false,
        bounty: 0,
        message: '❌ Time up! No bingo this round.'
      });
    }
    setGameActive(false);
    if (onGameEnd) {
      onGameEnd(result);
    }
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
    <div className="bingo-game">
      <div className="game-header">
        <h3>🎲 Bingo Game</h3>
        <div className="timer">⏱️ {timeLeft}s</div>
      </div>

      <p className="instructions">Click 3 cells in a row (horizontal, vertical, or diagonal)</p>

      <div className="bingo-board">
        {board.map((num, idx) => (
          <div
            key={idx}
            className={`bingo-cell ${selected.has(idx) ? 'selected' : ''}`}
            onClick={() => handleCellClick(idx)}
          >
            {num}
          </div>
        ))}
      </div>

      <div className="selected-count">
        Selected: {selected.size}/3
      </div>

      {gameActive && (
        <button className="finish-btn" onClick={handleFinish}>
          Submit Bingo
        </button>
      )}
    </div>
  );
}

export default BingoGame;
