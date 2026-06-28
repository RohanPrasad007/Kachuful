
export type Suit = 'spades' | 'diamonds' | 'clubs' | 'hearts';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
}

export interface Player {
  id: string;
  name: string;
  seat: number;
  sessionToken: string;
  connected: boolean;
  socketId: string;
  timerId?: NodeJS.Timeout | null;
}

export interface TrickCard {
  seat: number;
  card: Card;
}

const SUITS: Suit[] = ['spades', 'diamonds', 'clubs', 'hearts'];
const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

const RANK_VALUES: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

function generateDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ id: `${rank}_${suit}`, suit, rank });
    }
  }
  return deck;
}

function shuffle<T>(array: T[]): T[] {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex]!, array[currentIndex]!];
  }
  return array;
}

export class GameEngine {
  roomCode: string;
  players: Player[];
  numPlayers: number;
  maxCardsPerPlayer: number;
  totalRounds: number;
  
  roundNumber: number;
  dealerSeat: number;
  scores: Record<number, number>;
  state: 'starting' | 'bidding' | 'playing' | 'round_summary' | 'game_over';

  deck: Card[] = [];
  cardsThisRound: number = 0;
  trumpSuit: Suit | null = null;
  bids: Record<number, number> = {};
  tricksWon: Record<number, number> = {};
  currentTrick: TrickCard[] = [];
  leadSuit: Suit | null = null;
  turnSeat: number = 0;
  hands: Record<number, Card[]> = {};
  roundScores: Record<number, number> = {};

  constructor(roomCode: string, players: Player[]) {
    this.roomCode = roomCode;
    this.players = players;
    this.numPlayers = players.length;
    this.maxCardsPerPlayer = Math.floor(52 / this.numPlayers);
    this.totalRounds = (2 * this.maxCardsPerPlayer) - 1;
    
    this.roundNumber = 0;
    this.dealerSeat = 0;
    
    this.scores = {};
    this.players.forEach(p => this.scores[p.seat] = 0);
    
    this.state = 'starting';
  }

  resetRoundState() {
    this.deck = shuffle(generateDeck());
    this.cardsThisRound = 0;
    this.trumpSuit = null;
    this.bids = {};
    this.tricksWon = {};
    this.currentTrick = [];
    this.leadSuit = null;
    this.turnSeat = 0;
    this.players.forEach(p => this.tricksWon[p.seat] = 0);
    this.hands = {};
    this.roundScores = {};
  }

  startNextRound() {
    this.roundNumber++;
    if (this.roundNumber > this.totalRounds) {
      this.state = 'game_over';
      return null;
    }
    this.resetRoundState();
    
    if (this.roundNumber <= this.maxCardsPerPlayer) {
      this.cardsThisRound = this.roundNumber;
    } else {
      this.cardsThisRound = (2 * this.maxCardsPerPlayer) - this.roundNumber;
    }

    this.trumpSuit = SUITS[(this.roundNumber - 1) % 4]!;
    this.dealerSeat = (this.roundNumber - 1) % this.numPlayers;

    for (const player of this.players) {
      this.hands[player.seat] = this.deck.splice(0, this.cardsThisRound);
    }

    this.state = 'bidding';
    this.turnSeat = (this.dealerSeat + 1) % this.numPlayers;
    
    return {
      roundNumber: this.roundNumber,
      totalRounds: this.totalRounds,
      cardsThisRound: this.cardsThisRound,
      trumpSuit: this.trumpSuit,
      dealerSeat: this.dealerSeat,
      turnSeat: this.turnSeat,
    };
  }

  getForbiddenBid(): number | null {
    if (this.turnSeat === this.dealerSeat && this.state === 'bidding') {
      const sumBids = Object.values(this.bids).reduce((a, b) => a + b, 0);
      const forbidden = this.cardsThisRound - sumBids;
      if (forbidden >= 0 && forbidden <= this.cardsThisRound) {
        return forbidden;
      }
    }
    return null;
  }

  submitBid(seat: number, bidValue: number) {
    if (this.state !== 'bidding') return { error: "Not currently in bidding phase" };
    if (this.turnSeat !== seat) return { error: "Not your turn" };
    if (bidValue < 0 || bidValue > this.cardsThisRound) return { error: "Invalid bid value" };

    const forbidden = this.getForbiddenBid();
    if (forbidden !== null && bidValue === forbidden) {
      return { error: `Dealer cannot bid ${forbidden}` };
    }

    this.bids[seat] = bidValue;

    if (Object.keys(this.bids).length === this.numPlayers) {
      this.state = 'playing';
      this.turnSeat = (this.dealerSeat + 1) % this.numPlayers;
      return { event: 'bidding:complete', allBids: this.bids };
    } else {
      this.turnSeat = (this.turnSeat + 1) % this.numPlayers;
      return { event: 'bidding:turn' };
    }
  }

  playCard(seat: number, cardId: string) {
    if (this.state !== 'playing') return { error: "Not currently playing cards" };
    if (this.turnSeat !== seat) return { error: "Not your turn" };

    const hand = this.hands[seat];
    if (!hand) return { error: "Hand not found" };
    const cardIndex = hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return { error: "You don't have that card" };
    const card = hand[cardIndex]!;

    if (this.currentTrick.length > 0) {
      const hasLeadSuit = hand.some(c => c.suit === this.leadSuit);
      if (hasLeadSuit && card.suit !== this.leadSuit) {
        return { error: `You must follow suit (${this.leadSuit}) if you have it` };
      }
    } else {
      this.leadSuit = card.suit;
    }

    hand.splice(cardIndex, 1);
    this.currentTrick.push({ seat, card });

    if (this.currentTrick.length === this.numPlayers) {
      const winnerSeat = this.resolveTrick();
      this.tricksWon[winnerSeat]!++;
      
      const previousTrick = [...this.currentTrick];
      
      if (this.hands[seat]!.length === 0) {
        this.calculateRoundScores();
        this.state = 'round_summary';
        return { event: 'round:complete', winnerSeat, previousTrick };
      } else {
        this.currentTrick = [];
        this.leadSuit = null;
        this.turnSeat = winnerSeat;
        return { event: 'trick:resolved', winnerSeat, previousTrick };
      }
    } else {
      this.turnSeat = (this.turnSeat + 1) % this.numPlayers;
      return { event: 'trick:turn' };
    }
  }

  resolveTrick(): number {
    const trumps = this.currentTrick.filter(p => p.card.suit === this.trumpSuit);
    if (trumps.length > 0) {
      return this.getHighestCardSeat(trumps);
    } else {
      const leads = this.currentTrick.filter(p => p.card.suit === this.leadSuit);
      return this.getHighestCardSeat(leads);
    }
  }

  getHighestCardSeat(playedCards: TrickCard[]): number {
    let highest = playedCards[0]!;
    for (let i = 1; i < playedCards.length; i++) {
      if (RANK_VALUES[playedCards[i]!.card.rank] > RANK_VALUES[highest.card.rank]) {
        highest = playedCards[i]!;
      }
    }
    return highest.seat;
  }

  calculateRoundScores() {
    for (const player of this.players) {
      const seat = player.seat;
      const bid = this.bids[seat]!;
      const won = this.tricksWon[seat]!;
      if (bid === won) {
        this.roundScores[seat] = 10 + bid;
      } else {
        this.roundScores[seat] = 0;
      }
      this.scores[seat]! += this.roundScores[seat]!;
    }
  }

  getWinners(): number[] {
    let maxScore = -Infinity;
    let winners: number[] = [];
    for (const player of this.players) {
      if (this.scores[player.seat]! > maxScore) {
        maxScore = this.scores[player.seat]!;
        winners = [player.seat];
      } else if (this.scores[player.seat] === maxScore) {
        winners.push(player.seat);
      }
    }
    return winners;
  }
}
