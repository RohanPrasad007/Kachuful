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
      setRunningTotals(data.runningTotals);
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

  const isHost = myName === hostName;

  if (!isConnected) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Connecting to server...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
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
    </div>
  );
}
