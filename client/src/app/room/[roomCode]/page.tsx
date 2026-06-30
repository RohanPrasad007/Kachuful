'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSocket } from '../../../context/SocketContext';
import { LobbyView } from '../../../components/LobbyView';
import { BiddingView } from '../../../components/BiddingView';
import { TableView } from '../../../components/TableView';
import { RoundSummary } from '../../../components/RoundSummary';
import { GameOver } from '../../../components/GameOver';
import { Card } from '../../../components/Hand';

interface Player {
  name: string;
  seat: number;
  connected: boolean;
}

export default function RoomPage() {
  const params = useParams();
  const roomCode = params.roomCode as string;
  const router = useRouter();
  const { socket, isConnected } = useSocket();

  const [gameState, setGameState] = useState<'lobby' | 'bidding' | 'playing' | 'round_summary' | 'game_over'>('lobby');
  const [players, setPlayers] = useState<Player[]>([]);
  const [hostName, setHostName] = useState('');
  const [mySeat, setMySeat] = useState<number>(-1);
  const [myName, setMyName] = useState<string>('');

  // Round State
  const [hand, setHand] = useState<Card[]>([]);
  const [roundNumber, setRoundNumber] = useState(0);
  const [totalRounds, setTotalRounds] = useState(0);
  const [cardsThisRound, setCardsThisRound] = useState(0);
  const [trumpSuit, setTrumpSuit] = useState('');
  const [dealerSeat, setDealerSeat] = useState(0);
  const [turnSeat, setTurnSeat] = useState(0);
  
  // Bidding
  const [bids, setBids] = useState<Record<number, number>>({});
  const [forbiddenBid, setForbiddenBid] = useState<number | null>(null);

  // Playing
  const [currentTrick, setCurrentTrick] = useState<{seat: number, card: Card}[]>([]);
  const [leadSuit, setLeadSuit] = useState<string | null>(null);
  const [tricksWon, setTricksWon] = useState<Record<number, number>>({});
  const [winnerSeat, setWinnerSeat] = useState<number | null>(null);

  // Summary
  const [roundScores, setRoundScores] = useState<Record<number, number>>({});
  const [runningTotals, setRunningTotals] = useState<Record<number, number>>({});
  
  // Final
  const [winningSeats, setWinningSeats] = useState<number[]>([]);

  const [isScoreboardOpen, setIsScoreboardOpen] = useState(false);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const sessionToken = sessionStorage.getItem(`session_${roomCode}`);
    const storedName = sessionStorage.getItem('playerName');
    
    if (sessionToken && storedName) {
      setMyName(storedName);
      socket.emit('room:rejoin', { roomCode, sessionToken });
    } else {
      // No session, redirect to home to join properly
      router.push('/');
    }

    // Socket Listeners
    socket.on('room:updated', (data) => {
      setPlayers(data.players);
      setHostName(data.hostName);
    });

    socket.on('player:reconnected', (data) => {
      setMySeat(data.seat);
    });

    socket.on('game:started', () => {
      // Game started, but wait for round:started to change state
    });

    socket.on('round:started', (data) => {
      setRoundNumber(data.roundNumber);
      setTotalRounds(data.totalRounds);
      setCardsThisRound(data.cardsThisRound);
      setTrumpSuit(data.trumpSuit);
      setDealerSeat(data.dealerSeat);
      setTurnSeat(data.turnSeat);
      setHand(data.hand);
      setBids({});
      setTricksWon({});
      setCurrentTrick([]);
      setWinnerSeat(null);
      setGameState('bidding');
    });

    socket.on('bidding:turn', (data) => {
      setTurnSeat(data.currentBidderSeat);
      setBids(data.bidsSoFar);
      setForbiddenBid(data.forbiddenBidIfDealer);
    });

    socket.on('bidding:complete', (data) => {
      setBids(data.allBids);
      setGameState('playing');
    });

    socket.on('trick:turn', (data) => {
      setTurnSeat(data.currentPlayerSeat);
      setCurrentTrick(data.cardsPlayedThisTrick);
      setLeadSuit(data.leadSuit);
      setWinnerSeat(null);
    });

    socket.on('hand:updated', (data) => {
      setHand(data.hand);
    });

    socket.on('trick:resolved', (data) => {
      setCurrentTrick(data.cardsPlayedThisTrick);
      setWinnerSeat(data.winnerSeat);
      // Update tricks won locally for immediate feedback
      setTricksWon(prev => ({
        ...prev,
        [data.winnerSeat]: (prev[data.winnerSeat] || 0) + 1
      }));
    });

    socket.on('round:complete', (data) => {
      setBids(data.bids);
      setTricksWon(data.tricksWonPerPlayer);
      setRoundScores(data.scoresThisRound);
      setRunningTotals({ ...data.runningTotals });
      setGameState('round_summary');
    });

    socket.on('game:complete', (data) => {
      setRunningTotals(data.finalTotals);
      setWinningSeats(data.winningSeats);
      setGameState('game_over');
    });

    socket.on('error', (err) => {
      console.error('Socket error:', err);
      if (err.message === 'Invalid session token' || err.message === 'Room not found') {
        router.push('/');
      }
    });

    return () => {
      socket.off('room:updated');
      socket.off('player:reconnected');
      socket.off('game:started');
      socket.off('round:started');
      socket.off('bidding:turn');
      socket.off('bidding:complete');
      socket.off('trick:turn');
      socket.off('hand:updated');
      socket.off('trick:resolved');
      socket.off('round:complete');
      socket.off('game:complete');
      socket.off('error');
    };
  }, [socket, isConnected, roomCode, router]);

  const handleStartGame = () => {
    socket?.emit('game:start', { roomCode });
  };

  const handleSubmitBid = (bid: number) => {
    socket?.emit('bid:submit', { roomCode, bidValue: bid });
  };

  const handlePlayCard = (cardId: string) => {
    socket?.emit('card:play', { roomCode, cardId });
  };

  // Helper to calculate rankings and standings list
  const getStandings = () => {
    const standingsList = players.map(p => {
      const score = runningTotals[p.seat] || 0;
      return {
        name: p.name,
        seat: p.seat,
        score
      };
    });

    // Sort descending by score
    standingsList.sort((a, b) => b.score - a.score);

    // Calculate ranks handling ties
    let currentRank = 1;
    return standingsList.map((item, index) => {
      if (index > 0 && item.score < standingsList[index - 1]!.score) {
        currentRank = index + 1;
      }
      return {
        ...item,
        rank: currentRank
      };
    });
  };

  const standings = getStandings();
  const myStanding = standings.find(item => item.seat === mySeat);
  const myScore = myStanding ? myStanding.score : 0;
  const myRank = myStanding ? myStanding.rank : 1;

  const isHost = myName === hostName;

  if (!isConnected) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Connecting to server...</p>
      </div>
    );
  }

  return (
    <div className={`page-container${gameState === 'bidding' || gameState === 'playing' ? ' game-active' : ''}`}>
      {/* Floating Pill Badge */}
      {(gameState === 'bidding' || gameState === 'playing') && mySeat !== -1 && (
        <div className="score-rank-pill" onClick={() => setIsScoreboardOpen(true)}>
          <span className="material-symbols-outlined">leaderboard</span>
          <span>Score: {myScore}</span>
          <span className="pill-divider" />
          <span>Rank: #{myRank}</span>
        </div>
      )}

      {gameState === 'lobby' && (
        <LobbyView 
          roomCode={roomCode} 
          players={players} 
          hostName={hostName} 
          isHost={isHost} 
          onStartGame={handleStartGame} 
        />
      )}
      
      {gameState === 'bidding' && (
        <BiddingView
          hand={hand}
          trumpSuit={trumpSuit}
          roundNumber={roundNumber}
          totalRounds={totalRounds}
          cardsThisRound={cardsThisRound}
          players={players}
          dealerSeat={dealerSeat}
          currentBidderSeat={turnSeat}
          mySeat={mySeat}
          bidsSoFar={bids}
          forbiddenBidIfDealer={forbiddenBid}
          onSubmitBid={handleSubmitBid}
        />
      )}

      {gameState === 'playing' && (
        <TableView
          hand={hand}
          trumpSuit={trumpSuit}
          players={players}
          mySeat={mySeat}
          currentTurnSeat={turnSeat}
          cardsPlayedThisTrick={currentTrick}
          leadSuit={leadSuit}
          bids={bids}
          tricksWon={tricksWon}
          onPlayCard={handlePlayCard}
          winnerSeat={winnerSeat}
        />
      )}

      {gameState === 'round_summary' && (
        <RoundSummary
          players={players}
          bids={bids}
          tricksWon={tricksWon}
          scoresThisRound={roundScores}
          runningTotals={runningTotals}
          roundNumber={roundNumber}
        />
      )}

      {gameState === 'game_over' && (
        <GameOver
          players={players}
          finalTotals={runningTotals}
          winningSeats={winningSeats}
        />
      )}


      {/* Standings Modal Overlay */}
      {isScoreboardOpen && (
        <div className="scoreboard-modal-backdrop" onClick={() => setIsScoreboardOpen(false)}>
          <div className="scoreboard-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="scoreboard-modal-close" onClick={() => setIsScoreboardOpen(false)}>
              <span className="material-symbols-outlined">close</span>
            </button>
            <h2 style={{ fontFamily: 'var(--font-suit-display)', color: 'var(--primary)', marginBottom: '16px', fontSize: '1.8rem', textAlign: 'center' }}>
              Current Standings
            </h2>
            <table className="standings-table">
              <thead>
                <tr style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', borderBottom: '1px solid var(--outline-variant)' }}>
                  <th style={{ padding: '8px 16px', textAlign: 'left' }}>Rank</th>
                  <th style={{ padding: '8px 16px', textAlign: 'left' }}>Player</th>
                  <th style={{ padding: '8px 16px', textAlign: 'right' }}>Total Score</th>
                </tr>
              </thead>
              <tbody>
                {standings.map(item => (
                  <tr key={item.seat} className={`standings-row${item.seat === mySeat ? ' self' : ''}`}>
                    <td style={{ padding: '8px 16px' }}>
                      <span className={`standings-rank-badge rank-${item.rank}`}>
                        {item.rank}
                      </span>
                    </td>
                    <td style={{ padding: '8px 16px', fontWeight: item.seat === mySeat ? 'bold' : 'normal' }}>
                      {item.name} {item.seat === mySeat && '(You)'}
                    </td>
                    <td style={{ padding: '8px 16px', textAlign: 'right', fontWeight: 'bold' }}>
                      {item.score}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
