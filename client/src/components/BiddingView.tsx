import React, { useState } from 'react';
import { Card, Hand } from './Hand';

interface Player {
  name: string;
  seat: number;
}

interface BiddingViewProps {
  hand: Card[];
  trumpSuit: string;
  roundNumber: number;
  totalRounds: number;
  cardsThisRound: number;
  players: Player[];
  dealerSeat: number;
  currentBidderSeat: number;
  mySeat: number;
  bidsSoFar: Record<number, number>;
  forbiddenBidIfDealer: number | null;
  onSubmitBid: (bid: number) => void;
}

export const BiddingView: React.FC<BiddingViewProps> = ({
  hand,
  trumpSuit,
  roundNumber,
  totalRounds,
  cardsThisRound,
  players,
  dealerSeat,
  currentBidderSeat,
  mySeat,
  bidsSoFar,
  forbiddenBidIfDealer,
  onSubmitBid
}) => {
  const [selectedBid, setSelectedBid] = useState<number | null>(null);

  const getSuitIcon = (suit: string) => {
    switch (suit) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
      default: return '♥';
    }
  };

  const getSuitColor = (suit: string) => {
    return (suit === 'hearts' || suit === 'diamonds') ? 'var(--error)' : 'var(--on-surface)';
  };

  const isMyTurn = currentBidderSeat === mySeat;
  const isDealer = dealerSeat === mySeat;

  const totalBids = Object.values(bidsSoFar).reduce((a, b) => a + b, 0);

  // Generate bid options 0 to cardsThisRound
  const bidOptions = Array.from({ length: cardsThisRound + 1 }, (_, i) => i);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '250px' }}>
      
      {/* Header info */}
      <section className="responsive-grid-2">
        <div style={{ backgroundColor: 'var(--surface-container)', padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid var(--outline-variant)' }}>
          <div style={{ width: '80px', height: '80px', backgroundColor: (trumpSuit === 'hearts' || trumpSuit === 'diamonds') ? 'var(--error-container)' : 'var(--surface-variant)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '3rem', color: getSuitColor(trumpSuit) }}>
              {getSuitIcon(trumpSuit)}
            </span>
          </div>
          <div>
            <p style={{ fontWeight: 'bold', color: 'var(--on-surface-variant)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Trump Suit</p>
            <h1 style={{ fontSize: '2rem', margin: 0, textTransform: 'capitalize', color: 'var(--tertiary)' }}>{trumpSuit}</h1>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--surface-container)', padding: '16px', borderRadius: '16px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', border: '1px solid var(--outline-variant)' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 'bold', color: 'var(--on-surface-variant)' }}>ROUND</p>
            <p style={{ fontSize: '2rem', color: 'var(--primary)', fontWeight: 'bold', margin: 0 }}>{roundNumber} / {totalRounds}</p>
          </div>
          <div style={{ width: '1px', backgroundColor: 'var(--outline-variant)', height: '60px' }}></div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 'bold', color: 'var(--on-surface-variant)' }}>TOTAL BIDS</p>
            <p style={{ fontSize: '2rem', color: 'var(--on-surface)', fontWeight: 'bold', margin: 0 }}>{totalBids}</p>
          </div>
        </div>
      </section>

      {/* Players Bids */}
      <section style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px' }}>
        {players.map(p => {
          const isMe = p.seat === mySeat;
          const isThisDealer = p.seat === dealerSeat;
          const isBiddingNow = p.seat === currentBidderSeat;
          const bid = bidsSoFar[p.seat];

          return (
            <div key={p.seat} style={{ 
              flex: '0 0 auto',
              width: '150px',
              backgroundColor: isMe ? 'rgba(255,184,0,0.1)' : 'var(--surface-container)', 
              border: isMe ? '2px solid var(--primary-container)' : '1px solid var(--outline-variant)',
              borderRadius: '16px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative'
            }}>
              {isBiddingNow && (
                <div style={{ position: 'absolute', top: 0, right: 0, padding: '4px 8px', backgroundColor: 'var(--primary-container)', color: 'var(--on-primary-container)', fontSize: '0.7rem', fontWeight: 'bold', borderBottomLeftRadius: '8px' }}>
                  BIDDING
                </div>
              )}
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--surface-variant)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                {p.name.charAt(0).toUpperCase()}
              </div>
              <p style={{ fontWeight: 'bold', marginBottom: '8px', textAlign: 'center' }}>{p.name} {isMe ? '(You)' : ''}</p>
              
              {bid !== undefined ? (
                <div style={{ backgroundColor: 'var(--surface-variant)', padding: '4px 16px', borderRadius: '999px', color: 'var(--primary)', fontWeight: 'bold' }}>
                  {bid}
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>
                  Awaiting...
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* Bidding Controls */}
      <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', marginTop: '24px' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '8px' }}>
            {isMyTurn ? 'Your Turn to Bid' : 'Waiting for others to bid...'}
          </h2>
          <p style={{ color: 'var(--on-surface-variant)' }}>How many hands will you win this round?</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '600px' }}>
          {bidOptions.map(option => {
            const isForbidden = isMyTurn && isDealer && forbiddenBidIfDealer === option;
            const isSelected = selectedBid === option;
            
            return (
              <div key={option} style={{ position: 'relative' }} title={isForbidden ? `Dealer cannot bid ${option} to avoid total bids equaling cards.` : ''}>
                <button
                  disabled={!isMyTurn || isForbidden}
                  onClick={() => setSelectedBid(option)}
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '12px',
                    border: isSelected ? '2px solid var(--primary)' : (isForbidden ? '2px solid rgba(255,180,171,0.3)' : '2px solid var(--outline-variant)'),
                    backgroundColor: isSelected ? 'var(--primary)' : (isForbidden ? 'rgba(147,0,10,0.2)' : 'transparent'),
                    color: isSelected ? 'var(--on-primary)' : (isForbidden ? 'rgba(255,180,171,0.3)' : 'var(--on-surface)'),
                    fontSize: '1.5rem',
                    fontFamily: 'var(--font-suit-display)',
                    cursor: (!isMyTurn || isForbidden) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: (!isMyTurn) ? 0.5 : 1,
                  }}
                >
                  {option}
                </button>
              </div>
            );
          })}
        </div>

        <button 
          className="btn-primary" 
          disabled={!isMyTurn || selectedBid === null}
          onClick={() => {
            if (selectedBid !== null) onSubmitBid(selectedBid);
          }}
          style={{ opacity: (!isMyTurn || selectedBid === null) ? 0.5 : 1, padding: '16px 48px', fontSize: '1.2rem' }}
        >
          PLACE BID
        </button>
      </section>

      {/* Hand */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', zIndex: 40, pointerEvents: 'none', background: 'linear-gradient(to top, rgba(14,14,11,1) 0%, rgba(14,14,11,0.9) 50%, transparent 100%)', paddingTop: '48px' }}>
        <Hand cards={hand} disabled={true} />
      </div>

    </div>
  );
};
