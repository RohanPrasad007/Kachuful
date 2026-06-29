import React from 'react';
import { Card, Hand } from './Hand';

interface Player {
  name: string;
  seat: number;
}

interface TrickCard {
  seat: number;
  card: Card;
}

interface TableViewProps {
  hand: Card[];
  trumpSuit: string;
  players: Player[];
  mySeat: number;
  currentTurnSeat: number;
  cardsPlayedThisTrick: TrickCard[];
  leadSuit: string | null;
  bids: Record<number, number>;
  tricksWon: Record<number, number>;
  onPlayCard: (cardId: string) => void;
  winnerSeat: number | null; // Set when a trick resolves briefly
}

export const TableView: React.FC<TableViewProps> = ({
  hand,
  trumpSuit,
  players,
  mySeat,
  currentTurnSeat,
  cardsPlayedThisTrick,
  leadSuit,
  bids,
  tricksWon,
  onPlayCard,
  winnerSeat
}) => {
  const isMyTurn = currentTurnSeat === mySeat;

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top Bar: Trump & Turn indicator */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--surface-container)', padding: '8px 16px', borderRadius: '999px', border: '1px solid var(--outline-variant)' }}>
          <span style={{ color: 'var(--on-surface-variant)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Trump</span>
          <span style={{ color: getSuitColor(trumpSuit) }}>
            {getSuitIcon(trumpSuit)}
          </span>
        </div>
        
        {winnerSeat !== null ? (
          <div style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.2rem' }}>
            {players.find(p => p.seat === winnerSeat)?.name} won the trick!
          </div>
        ) : (
          <div style={{ color: isMyTurn ? 'var(--primary)' : 'var(--on-surface-variant)', fontWeight: 'bold', fontSize: '1.2rem' }}>
            {isMyTurn ? 'Your Turn to Play' : `Waiting for ${players.find(p => p.seat === currentTurnSeat)?.name}...`}
          </div>
        )}
      </div>

      {/* Opponents & Stats around table */}
      <div style={{ flex: 1, position: 'relative', minHeight: '300px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
           {players.filter(p => p.seat !== mySeat).map(p => (
             <div key={p.seat} style={{ 
               backgroundColor: currentTurnSeat === p.seat ? 'rgba(255,184,0,0.1)' : 'var(--surface-container)', 
               border: currentTurnSeat === p.seat ? '2px solid var(--primary)' : '1px solid var(--outline-variant)',
               borderRadius: '8px',
               padding: '8px 16px',
               display: 'flex',
               flexDirection: 'column',
               alignItems: 'center',
               minWidth: '100px'
             }}>
               <div style={{ fontWeight: 'bold', color: 'var(--on-surface)' }}>{p.name}</div>
               <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>
                 Won: {tricksWon[p.seat] || 0} / {bids[p.seat]}
               </div>
             </div>
           ))}
        </div>

        {/* The Trick Table Area */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'min(300px, 90vw)', height: 'min(300px, 90vw)', borderRadius: '50%', border: '1px dashed var(--outline-variant)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
           {cardsPlayedThisTrick.map((played, i) => {
             const angle = (i * (360 / Math.max(1, cardsPlayedThisTrick.length))) * (Math.PI / 180);
             const radius = 60;
             const x = Math.sin(angle) * radius;
             const y = -Math.cos(angle) * radius;
             const rotation = angle * (180 / Math.PI);
             const playerName = players.find(p => p.seat === played.seat)?.name;

             const icon = getSuitIcon(played.card.suit);
             const color = getSuitColor(played.card.suit);

             return (
               <div key={played.seat} style={{ 
                 position: 'absolute', 
                 transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
                 transition: 'all 0.5s ease',
                 display: 'flex',
                 flexDirection: 'column',
                 alignItems: 'center'
               }}>
                 <div style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', marginBottom: '4px', background: 'var(--surface)', padding: '2px 4px', borderRadius: '4px' }}>
                   {playerName}
                 </div>
                 <div className={`playing-card ${color === 'var(--error)' ? 'red' : 'black'}`} style={{ width: '60px', height: '90px', transform: 'scale(1)', margin: 0, pointerEvents: 'none' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', alignSelf: 'flex-start', lineHeight: 1 }}>
                      <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>{played.card.rank}</span>
                      <span style={{ fontSize: '1rem' }}>{icon}</span>
                    </div>
                 </div>
               </div>
             );
           })}
        </div>
      </div>

      {/* My Stats & Hand */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '0 16px', zIndex: 50, position: 'relative' }}>
         <div style={{ backgroundColor: 'var(--surface-container)', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--outline-variant)' }}>
            <span style={{ color: 'var(--on-surface-variant)', marginRight: '8px' }}>Your Target:</span>
            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{tricksWon[mySeat] || 0} / {bids[mySeat]}</span>
         </div>
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', zIndex: 40, background: 'linear-gradient(to top, rgba(14,14,11,1) 0%, rgba(14,14,11,0.9) 50%, transparent 100%)', paddingTop: '48px' }}>
        <Hand 
          cards={hand} 
          disabled={!isMyTurn || winnerSeat !== null} 
          onPlayCard={onPlayCard} 
        />
      </div>
    </div>
  );
};
