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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '160px' }}>
      
      {/* Header Info */}
      <section className="bidding-header-desktop">
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

      {/* Static Header Info (Mobile Only) */}
      <section className="bidding-header-mobile">
        {/* Compact bar - always visible */}
        <div 
          style={{ 
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            backgroundColor: 'var(--surface-container)', padding: '10px 16px',
            borderRadius: '12px', border: '1px solid var(--outline-variant)',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1.4rem', color: getSuitColor(trumpSuit) }}>{getSuitIcon(trumpSuit)}</span>
              <span style={{ textTransform: 'capitalize', color: 'var(--tertiary)', fontWeight: 'bold', fontSize: '1rem' }}>{trumpSuit}</span>
            </div>
            <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--outline-variant)' }} />
            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>R {roundNumber}/{totalRounds}</span>
            <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--outline-variant)' }} />
            <span style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem' }}>Bids: <strong style={{ color: 'var(--on-surface)' }}>{totalBids}</strong></span>
          </div>
        </div>
      </section>

      {/* Players Bids Status */}
      <section className="bidding-players-container">
        {players.map(p => {
          const isMe = p.seat === mySeat;
          const isBiddingNow = p.seat === currentBidderSeat;
          const bid = bidsSoFar[p.seat];

          return (
            <div 
              key={p.seat} 
              className={`bidding-player-card${isMe ? ' is-me' : ''}${isBiddingNow ? ' active' : ''}`}
            >
              {isBiddingNow && (
                <div className="bidding-player-active-label">
                  BIDDING
                </div>
              )}
              <div className="bidding-player-avatar">
                {p.name.charAt(0).toUpperCase()}
              </div>
              <span className="bidding-player-name">
                {p.name} {isMe ? '(You)' : ''}
              </span>
              
              {bid !== undefined ? (
                <span className="bidding-player-badge">
                  {bid}
                </span>
              ) : (
                <span className="bidding-player-status">
                  {isBiddingNow ? 'Bidding...' : 'Awaiting...'}
                </span>
              )}
            </div>
          );
        })}
      </section>

      {/* Bidding Controls */}
      <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginBottom: '4px' }}>
            {isMyTurn ? 'Your Turn to Bid' : 'Waiting for others to bid...'}
          </h2>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', margin: 0 }}>How many hands will you win this round?</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '600px' }}>
          {bidOptions.map(option => {
            const isForbidden = isMyTurn && isDealer && forbiddenBidIfDealer === option;
            const isSelected = selectedBid === option;
            
            return (
              <div key={option} style={{ position: 'relative' }} title={isForbidden ? `Dealer cannot bid ${option} to avoid total bids equaling cards.` : ''}>
                <button
                  disabled={!isMyTurn || isForbidden}
                  onClick={() => setSelectedBid(option)}
                  className={`bid-button${isSelected ? ' selected' : ''}${isForbidden ? ' forbidden' : ''}`}
                  style={{
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
