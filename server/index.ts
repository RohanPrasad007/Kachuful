import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { GameEngine, Player } from './game';

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // For dev, refine for production
    methods: ['GET', 'POST']
  }
});

interface Room {
  hostName: string;
  players: Player[];
  engine: GameEngine | null;
}

// In-memory data store
const rooms: Record<string, Room> = {};
const DISCONNECT_GRACE_PERIOD_MS = 30000;

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateSessionToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function broadcastRoomUpdate(roomCode: string) {
  if (rooms[roomCode]) {
    io.to(roomCode).emit('room:updated', {
      roomCode,
      hostName: rooms[roomCode].hostName,
      players: rooms[roomCode].players.map(p => ({
        name: p.name,
        seat: p.seat,
        connected: p.connected
      }))
    });
  }
}

function broadcastGameState(roomCode: string, event: string, payload: any = {}) {
  io.to(roomCode).emit(event, payload);
}

function handleAutoPlay(roomCode: string, seat: number) {
  const room = rooms[roomCode];
  if (!room || !room.engine) return;
  const engine = room.engine;
  
  if (engine.state === 'bidding' && engine.turnSeat === seat) {
    let bid = 0;
    const forbidden = engine.getForbiddenBid();
    if (forbidden === 0) bid = 1;
    const res = engine.submitBid(seat, bid);
    handleEngineResult(roomCode, engine, res);
  } else if (engine.state === 'playing' && engine.turnSeat === seat) {
    const hand = engine.hands[seat];
    if (!hand || hand.length === 0) return;
    
    let cardToPlay = hand[0]!;
    
    const RANK_VALUES: Record<string, number> = {'2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14};
    
    const sortedHand = [...hand].sort((a, b) => {
      return RANK_VALUES[a.rank]! - RANK_VALUES[b.rank]!;
    });

    if (engine.currentTrick.length > 0) {
      const leadCards = sortedHand.filter(c => c.suit === engine.leadSuit);
      if (leadCards.length > 0) {
        cardToPlay = leadCards[0]!;
      } else {
        cardToPlay = sortedHand[0]!;
      }
    } else {
      cardToPlay = sortedHand[0]!;
    }
    
    const res = engine.playCard(seat, cardToPlay.id);
    handleEngineResult(roomCode, engine, res);
  }
}

function handleEngineResult(roomCode: string, engine: GameEngine, res: any) {
  if (res.error) {
    console.error(`AutoPlay error in room ${roomCode}:`, res.error);
    return;
  }

  if (res.event === 'bidding:turn') {
    broadcastGameState(roomCode, 'bidding:turn', {
      currentBidderSeat: engine.turnSeat,
      bidsSoFar: engine.bids,
      forbiddenBidIfDealer: engine.getForbiddenBid()
    });
    checkStartTimer(roomCode, engine.turnSeat);
  } else if (res.event === 'bidding:complete') {
    broadcastGameState(roomCode, 'bidding:complete', { allBids: engine.bids });
    broadcastGameState(roomCode, 'trick:turn', {
      currentPlayerSeat: engine.turnSeat,
      cardsPlayedThisTrick: engine.currentTrick,
      leadSuit: engine.leadSuit
    });
    checkStartTimer(roomCode, engine.turnSeat);
  } else if (res.event === 'trick:turn') {
    broadcastGameState(roomCode, 'trick:turn', {
      currentPlayerSeat: engine.turnSeat,
      cardsPlayedThisTrick: engine.currentTrick,
      leadSuit: engine.leadSuit
    });
    checkStartTimer(roomCode, engine.turnSeat);
  } else if (res.event === 'trick:resolved') {
    broadcastGameState(roomCode, 'trick:resolved', {
      winnerSeat: res.winnerSeat,
      cardsPlayedThisTrick: res.previousTrick
    });
    
    setTimeout(() => {
      broadcastGameState(roomCode, 'trick:turn', {
        currentPlayerSeat: engine.turnSeat,
        cardsPlayedThisTrick: engine.currentTrick,
        leadSuit: engine.leadSuit
      });
      checkStartTimer(roomCode, engine.turnSeat);
    }, 2000);
    
  } else if (res.event === 'round:complete') {
    broadcastGameState(roomCode, 'trick:resolved', {
      winnerSeat: res.winnerSeat,
      cardsPlayedThisTrick: res.previousTrick
    });
    
    setTimeout(() => {
      broadcastGameState(roomCode, 'round:complete', {
        bids: engine.bids,
        tricksWonPerPlayer: engine.tricksWon,
        scoresThisRound: engine.roundScores,
        runningTotals: engine.scores
      });
      
      setTimeout(() => {
        startRound(roomCode);
      }, 10000);
    }, 2000);
  }
}

function startRound(roomCode: string) {
  const room = rooms[roomCode];
  if (!room || !room.engine) return;
  const engine = room.engine;
  
  const roundInfo = engine.startNextRound();
  
  if (engine.state === 'game_over') {
    broadcastGameState(roomCode, 'game:complete', {
      finalTotals: engine.scores,
      winningSeats: engine.getWinners()
    });
    return;
  }
  
  for (const p of room.players) {
    io.to(p.socketId).emit('round:started', {
      ...roundInfo,
      hand: engine.hands[p.seat]
    });
  }
  
  broadcastGameState(roomCode, 'bidding:turn', {
    currentBidderSeat: engine.turnSeat,
    bidsSoFar: engine.bids,
    forbiddenBidIfDealer: engine.getForbiddenBid()
  });
  
  checkStartTimer(roomCode, engine.turnSeat);
}

function checkStartTimer(roomCode: string, seat: number) {
  const room = rooms[roomCode];
  if (!room) return;
  const player = room.players.find(p => p.seat === seat);
  if (player && !player.connected) {
    if (player.timerId) clearTimeout(player.timerId);
    player.timerId = setTimeout(() => {
      handleAutoPlay(roomCode, seat);
    }, DISCONNECT_GRACE_PERIOD_MS);
  }
}

io.on('connection', (socket: Socket) => {
  console.log('Client connected:', socket.id);

  socket.on('room:create', ({ hostName }: { hostName: string }) => {
    const roomCode = generateRoomCode();
    const sessionToken = generateSessionToken();
    
    rooms[roomCode] = {
      hostName,
      players: [{
        id: sessionToken, // simplified
        socketId: socket.id,
        name: hostName,
        seat: 0,
        sessionToken,
        connected: true
      }],
      engine: null
    };
    
    socket.join(roomCode);
    socket.emit('room:created', { roomCode, sessionToken, seat: 0 });
    broadcastRoomUpdate(roomCode);
  });

  socket.on('room:join', ({ roomCode, playerName }: { roomCode: string, playerName: string }) => {
    const room = rooms[roomCode];
    if (!room) return socket.emit('error', { message: 'Room not found' });
    if (room.engine) return socket.emit('error', { message: 'Game already in progress' });
    if (room.players.length >= 10) return socket.emit('error', { message: 'Room is full' });
    
    const sessionToken = generateSessionToken();
    const seat = room.players.length;
    
    room.players.push({
      id: sessionToken,
      socketId: socket.id,
      name: playerName,
      seat,
      sessionToken,
      connected: true
    });
    
    socket.join(roomCode);
    socket.emit('room:joined', { roomCode, sessionToken, seat });
    broadcastRoomUpdate(roomCode);
  });

  socket.on('room:rejoin', ({ roomCode, sessionToken }: { roomCode: string, sessionToken: string }) => {
    const room = rooms[roomCode];
    if (!room) return socket.emit('error', { message: 'Room not found' });
    
    const player = room.players.find(p => p.sessionToken === sessionToken);
    if (!player) return socket.emit('error', { message: 'Invalid session token' });
    
    player.socketId = socket.id;
    player.connected = true;
    if (player.timerId) {
      clearTimeout(player.timerId);
      player.timerId = null;
    }
    
    socket.join(roomCode);
    socket.emit('player:reconnected', { seat: player.seat });
    broadcastRoomUpdate(roomCode);
    
    if (room.engine) {
      socket.emit('game:started');
      socket.emit('round:started', {
        roundNumber: room.engine.roundNumber,
        totalRounds: room.engine.totalRounds,
        cardsThisRound: room.engine.cardsThisRound,
        trumpSuit: room.engine.trumpSuit,
        dealerSeat: room.engine.dealerSeat,
        turnSeat: room.engine.turnSeat,
        hand: room.engine.hands[player.seat]
      });
      if (room.engine.state === 'bidding') {
        socket.emit('bidding:turn', {
          currentBidderSeat: room.engine.turnSeat,
          bidsSoFar: room.engine.bids,
          forbiddenBidIfDealer: room.engine.getForbiddenBid()
        });
      } else if (room.engine.state === 'playing') {
        socket.emit('trick:turn', {
          currentPlayerSeat: room.engine.turnSeat,
          cardsPlayedThisTrick: room.engine.currentTrick,
          leadSuit: room.engine.leadSuit
        });
      }
    }
  });

  socket.on('game:start', ({ roomCode }: { roomCode: string }) => {
    const room = rooms[roomCode];
    if (!room) return;
    if (room.players[0]!.socketId !== socket.id) return;
    if (room.players.length < 3) return socket.emit('error', { message: 'Need at least 3 players' });
    
    room.engine = new GameEngine(roomCode, room.players);
    broadcastGameState(roomCode, 'game:started');
    startRound(roomCode);
  });

  socket.on('bid:submit', ({ roomCode, bidValue }: { roomCode: string, bidValue: number }) => {
    const room = rooms[roomCode];
    if (!room || !room.engine) return;
    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;
    
    const res = room.engine.submitBid(player.seat, bidValue);
    if (res.error) {
      socket.emit('error', { message: res.error });
    } else {
      handleEngineResult(roomCode, room.engine, res);
    }
  });

  socket.on('card:play', ({ roomCode, cardId }: { roomCode: string, cardId: string }) => {
    const room = rooms[roomCode];
    if (!room || !room.engine) return;
    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;
    
    const res = room.engine.playCard(player.seat, cardId);
    if (res.error) {
      socket.emit('error', { message: res.error });
    } else {
      socket.emit('hand:updated', { hand: room.engine.hands[player.seat] });
      handleEngineResult(roomCode, room.engine, res);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    for (const roomCode in rooms) {
      const room = rooms[roomCode]!;
      const player = room.players.find(p => p.socketId === socket.id);
      if (player) {
        player.connected = false;
        broadcastRoomUpdate(roomCode);
        broadcastGameState(roomCode, 'player:disconnected', { seat: player.seat });
        
        if (room.engine && room.engine.turnSeat === player.seat) {
           checkStartTimer(roomCode, player.seat);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
