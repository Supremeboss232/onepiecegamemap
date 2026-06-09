import React, { useState, useEffect } from 'react';
import { BingoGame } from './BingoGame';
import { DodgeballGame } from './DodgeballGame';
import { BoxingGame } from './BoxingGame';
import { BoatRaceGame } from './BoatRaceGame';
import { TreasureHuntGame } from './TreasureHuntGame';
import { apiClient } from '../api/apiClient';

export function DavyBackFightUI({ playerId, token, onTournamentEnd }) {
  const [tournamentActive, setTournamentActive] = useState(false);
  const [currentGame, setCurrentGame] = useState(0);
  const [totalBounty, setTotalBounty] = useState(0);
  const [gameResults, setGameResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const games = [
    { name: 'Bingo', component: BingoGame, icon: '🎲' },
    { name: 'Dodgeball', component: DodgeballGame, icon: '⚽' },
    { name: 'Boxing', component: BoxingGame, icon: '🥊' },
    { name: 'Boat Race', component: BoatRaceGame, icon: '🚤' },
    { name: 'Treasure Hunt', component: TreasureHuntGame, icon: '⛏️' }
  ];

  const startTournament = () => {
    setTournamentActive(true);
    setCurrentGame(0);
    setGameResults([]);
    setTotalBounty(0);
  };

  const handleGameEnd = (result) => {
    const newResults = [...gameResults, result];
    setGameResults(newResults);
    setTotalBounty((prev) => prev + (result.bounty || 0));

    if (currentGame < games.length - 1) {
      // Move to next game
      setTimeout(() => {
        setCurrentGame((prev) => prev + 1);
      }, 2000);
    } else {
      // Tournament complete
      completeTournament(newResults);
    }
  };

  const completeTournament = async (results) => {
    setLoading(true);
    setError(null);

    try {
      if (apiClient && typeof apiClient.completeDavyBackFight === 'function') {
        const submitResult = await apiClient.completeDavyBackFight(playerId, {
          games: results,
          totalBounty
        });

        if (submitResult.success) {
          setTournamentActive(false);
          if (onTournamentEnd) {
            onTournamentEnd({ totalBounty, results });
          }
        } else {
          setError(submitResult.message || 'Failed to complete tournament');
        }
      } else {
        // Offline mode
        setTournamentActive(false);
        if (onTournamentEnd) {
          onTournamentEnd({ totalBounty, results });
        }
      }
    } catch (err) {
      console.error('Tournament completion error:', err);
      setError('Failed to complete tournament');
    } finally {
      setLoading(false);
    }
  };

  if (!tournamentActive) {
    return (
      <div className="davy-back-fight-panel">
        <div className="panel-header">
          <h3>🏴‍☠️ Davy Back Fight Tournament</h3>
        </div>

        <div className="tournament-intro">
          <p>
            Challenge your skills across 5 exciting mini-games! Each game rewards Bounty based on your performance.
          </p>

          <div className="games-preview">
            {games.map((game, idx) => (
              <div key={idx} className="game-preview-card">
                <div className="game-icon">{game.icon}</div>
                <div className="game-name">{game.name}</div>
                <div className="game-reward">10K-25K Bounty</div>
              </div>
            ))}
          </div>

          <p className="total-possible">💰 Total Possible: 50K-100K+ Bounty</p>

          {error && <div className="error-message">⚠️ {error}</div>}

          <button
            className="start-tournament-btn"
            onClick={startTournament}
            disabled={loading}
          >
            {loading ? 'Starting...' : '🎮 Start Tournament'}
          </button>
        </div>
      </div>
    );
  }

  const CurrentGame = games[currentGame].component;

  return (
    <div className="davy-back-fight-panel tournament-active">
      <div className="panel-header">
        <h3>🏴‍☠️ Davy Back Fight - {games[currentGame].icon} {games[currentGame].name}</h3>
        <div className="tournament-progress">
          Game {currentGame + 1}/{games.length}
        </div>
      </div>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${((currentGame + 1) / games.length) * 100}%` }}
        ></div>
      </div>

      <div className="game-container">
        <CurrentGame
          playerId={playerId}
          token={token}
          onGameEnd={handleGameEnd}
        />
      </div>

      <div className="tournament-stats">
        <p>💰 Tournament Bounty: +{totalBounty}</p>
        <p>Completed: {gameResults.length}/{games.length}</p>
      </div>

      {/* Results Summary */}
      {gameResults.length > 0 && (
        <div className="results-summary">
          <h4>Results So Far:</h4>
          <div className="results-list">
            {gameResults.map((result, idx) => (
              <div key={idx} className={`result-item ${result.success ? 'success' : 'fail'}`}>
                <span className="game-name">{games[idx].icon} {games[idx].name}</span>
                <span className="bounty">+{result.bounty} bounty</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DavyBackFightUI;
