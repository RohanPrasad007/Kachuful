import React from 'react';

export interface Card {
  id: string;
  suit: 'spades' | 'diamonds' | 'clubs' | 'hearts';
  rank: string;
}

interface HandProps {
  cards: Card[];
  onPlayCard?: (cardId: string) => void;
  disabled?: boolean;
}

export const Hand: React.FC<HandProps> = ({ cards, onPlayCard, disabled }) => {
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
    return (suit === 'hearts' || suit === 'diamonds') ? 'red' : 'black';
  };

  return (
    <div className="card-fan">
      {cards.map((card, index) => {
        const icon = getSuitIcon(card.suit);
        const colorClass = getSuitColor(card.suit);
        
        const getMarginLeft = (index: number, totalCards: number) => {
          if (index === 0) return '0px';
          if (totalCards <= 5) return '-50px';
          if (totalCards <= 10) return '-70px';
          return '-85px';
        };

        const marginLeft = getMarginLeft(index, cards.length);

        return (
          <div 
            key={card.id} 
            className={`playing-card ${colorClass}`}
            onClick={() => {
              if (!disabled && onPlayCard) {
                onPlayCard(card.id);
              }
            }}
            style={{ 
              filter: disabled ? 'brightness(0.6)' : 'none', 
              cursor: disabled ? 'default' : 'pointer',
              marginLeft: marginLeft
            }}
          >
            <div className="card-top-left">
              <span>{card.rank}</span>
              <span>{icon}</span>
            </div>
            <div className="card-center">
              <span>{icon}</span>
            </div>
            <div className="card-bottom-right">
              <span>{card.rank}</span>
              <span>{icon}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
