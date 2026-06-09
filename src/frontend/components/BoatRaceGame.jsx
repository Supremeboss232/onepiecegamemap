import React, { useState, useEffect, useRef } from 'react';

export function BoatRaceGame({ onGameEnd, playerId, token }) {
  const canvasRef = useRef(null);
  const [gameActive, setGameActive] = useState(true);
  const [result, setResult] = useState(null);
  const [distance, setDistance] = useState(0);
  const [collisions, setCollisions] = useState(0);
  const boatRef = useRef({ x: 150, y: 300, width: 40, height: 20 });
  const obstaclesRef = useRef([]);
  const keysRef = useRef({});

  useEffect(() => {
    const handleKeyDown = (e) => {
      keysRef.current[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;
    let gameTime = 40; // 40 second race
    let distanceTraveled = 0;

    const gameLoop = () => {
      // Clear canvas
      ctx.fillStyle = '#001f4d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw water effect
      ctx.strokeStyle = '#0066cc';
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(0, (i * 60 + distanceTraveled) % canvas.height);
        ctx.lineTo(canvas.width, (i * 60 + distanceTraveled) % canvas.height);
        ctx.stroke();
      }

      // Handle boat movement
      const moveSpeed = 3;
      if (keysRef.current['a'] || keysRef.current['arrowleft']) {
        boatRef.current.x = Math.max(0, boatRef.current.x - moveSpeed);
      }
      if (keysRef.current['d'] || keysRef.current['arrowright']) {
        boatRef.current.x = Math.min(canvas.width - boatRef.current.width, boatRef.current.x + moveSpeed);
      }

      // Draw boat
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(boatRef.current.x, boatRef.current.y, boatRef.current.width, boatRef.current.height);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(boatRef.current.x + boatRef.current.width / 2, boatRef.current.y - 10, 5, 0, Math.PI * 2);
      ctx.fill();

      // Spawn obstacles
      if (Math.random() < 0.08) {
        obstaclesRef.current.push({
          x: Math.random() * (canvas.width - 30),
          y: -30,
          width: 30,
          height: 30,
          speed: 2
        });
      }

      // Update and draw obstacles
      let hitObstacle = false;
      obstaclesRef.current = obstaclesRef.current.filter((obs) => {
        obs.y += obs.speed;

        // Draw obstacle
        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.fillText('🪨', obs.x + 5, obs.y + 20);

        // Check collision
        if (
          obs.x < boatRef.current.x + boatRef.current.width &&
          obs.x + obs.width > boatRef.current.x &&
          obs.y < boatRef.current.y + boatRef.current.height &&
          obs.y + obs.height > boatRef.current.y
        ) {
          hitObstacle = true;
          return false;
        }

        return obs.y < canvas.height;
      });

      if (hitObstacle) {
        setCollisions((prev) => prev + 1);
      }

      distanceTraveled += 1;
      setDistance(distanceTraveled);

      // Draw HUD
      ctx.fillStyle = '#fff';
      ctx.font = '14px Arial';
      ctx.fillText(`Distance: ${Math.floor(distanceTraveled / 10)}m`, 10, 25);
      ctx.fillText(`Collisions: ${collisions}`, 10, 45);
      ctx.fillText(`Controls: A/D or Arrow Keys`, 10, 65);

      if (gameActive && gameTime > 0) {
        animationId = requestAnimationFrame(gameLoop);
      } else {
        endGame(distanceTraveled);
      }
    };

    // Timer
    const timerInterval = setInterval(() => {
      gameTime--;
      if (gameTime <= 0) {
        setGameActive(false);
      }
    }, 1000);

    if (gameActive) {
      animationId = requestAnimationFrame(gameLoop);
    }

    return () => {
      cancelAnimationFrame(animationId);
      clearInterval(timerInterval);
    };
  }, [gameActive, collisions]);

  const endGame = (finalDistance) => {
    const bounty = Math.floor(12000 + finalDistance - collisions * 1000);
    setResult({
      success: true,
      bounty: Math.max(5000, bounty),
      message: `🏁 Race Complete! Distance: ${Math.floor(finalDistance / 10)}m, Collisions: ${collisions}`
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
    <div className="boat-race-game">
      <div className="game-header">
        <h3>🚤 Boat Race</h3>
        <p>Navigate through obstacles! Use A/D or Arrow Keys to steer.</p>
      </div>
      <canvas
        ref={canvasRef}
        width={300}
        height={300}
        className="game-canvas"
      />
      <div className="stats">
        <div>Distance: {Math.floor(distance / 10)}m</div>
        <div>Collisions: {collisions}</div>
      </div>
    </div>
  );
}

export default BoatRaceGame;
