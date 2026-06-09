import React, { useState, useEffect, useRef } from 'react';

export function DodgeballGame({ onGameEnd, playerId, token }) {
  const canvasRef = useRef(null);
  const [gameActive, setGameActive] = useState(true);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const playerRef = useRef({ x: 150, y: 250, width: 30, height: 30 });
  const projectilesRef = useRef([]);
  const dodgeCountRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;
    let gameTime = 30; // 30 second game

    const gameLoop = () => {
      // Clear canvas
      ctx.fillStyle = '#0a0e27';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw player
      ctx.fillStyle = '#4a90e2';
      ctx.fillRect(playerRef.current.x, playerRef.current.y, playerRef.current.width, playerRef.current.height);
      ctx.strokeStyle = '#7bb3ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(playerRef.current.x, playerRef.current.y, playerRef.current.width, playerRef.current.height);

      // Spawn projectiles randomly
      if (Math.random() < 0.05) {
        projectilesRef.current.push({
          x: Math.random() * (canvas.width - 20),
          y: -20,
          width: 15,
          height: 15,
          speed: 2 + Math.random() * 2
        });
      }

      // Update and draw projectiles
      projectilesRef.current = projectilesRef.current.filter(proj => {
        proj.y += proj.speed;

        // Draw projectile
        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(proj.x, proj.y, proj.width, proj.height);
        ctx.fillStyle = '#ff9999';
        ctx.beginPath();
        ctx.arc(proj.x + proj.width / 2, proj.y + proj.height / 2, proj.width, 0, Math.PI * 2);
        ctx.fill();

        // Check collision with player
        if (
          proj.x < playerRef.current.x + playerRef.current.width &&
          proj.x + proj.width > playerRef.current.x &&
          proj.y < playerRef.current.y + playerRef.current.height &&
          proj.y + proj.height > playerRef.current.y
        ) {
          setHealth((prev) => Math.max(0, prev - 10));
          return false; // Remove projectile
        }

        return proj.y < canvas.height;
      });

      // Draw HUD
      ctx.fillStyle = '#fff';
      ctx.font = '14px Arial';
      ctx.fillText(`Score: ${score}`, 10, 25);
      ctx.fillText(`Health: ${health}%`, 10, 45);
      ctx.fillText(`Dodges: ${dodgeCountRef.current}`, 10, 65);

      if (gameActive && health > 0) {
        animationId = requestAnimationFrame(gameLoop);
      } else if (health <= 0) {
        endGame(false);
      }
    };

    if (gameActive) {
      animationId = requestAnimationFrame(gameLoop);
    }

    // Timer
    const timerInterval = setInterval(() => {
      gameTime--;
      if (gameTime <= 0) {
        setGameActive(false);
        endGame(true);
      }
    }, 1000);

    // Mouse movement
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - playerRef.current.width / 2;
      playerRef.current.x = Math.max(0, Math.min(canvas.width - playerRef.current.width, x));
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    return () => {
      cancelAnimationFrame(animationId);
      clearInterval(timerInterval);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [gameActive, score, health]);

  const endGame = (success) => {
    const bounty = success ? Math.floor(15000 + dodgeCountRef.current * 100) : 0;
    setResult({
      success,
      bounty,
      message: success ? `🎯 Survived! You dodged ${dodgeCountRef.current} projectiles!` : '❌ Game Over! Hit by projectiles.'
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
    <div className="dodgeball-game">
      <div className="game-header">
        <h3>⚽ Dodgeball Game</h3>
        <p>Avoid the projectiles! Move your mouse to dodge.</p>
      </div>
      <canvas
        ref={canvasRef}
        width={300}
        height={300}
        className="game-canvas"
      />
    </div>
  );
}

export default DodgeballGame;
