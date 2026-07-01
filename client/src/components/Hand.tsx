import React, { useRef, useCallback, useEffect } from 'react';

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

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

  const updateScrollIndicators = useCallback(() => {
    const el = scrollRef.current;
    const wrapper = wrapperRef.current;
    if (!el || !wrapper) return;

    const canScrollLeft = el.scrollLeft > 2;
    const canScrollRight = el.scrollLeft < el.scrollWidth - el.clientWidth - 2;

    wrapper.classList.toggle('can-scroll-left', canScrollLeft);
    wrapper.classList.toggle('can-scroll-right', canScrollRight);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateScrollIndicators();
    el.addEventListener('scroll', updateScrollIndicators, { passive: true });
    window.addEventListener('resize', updateScrollIndicators);

    return () => {
      el.removeEventListener('scroll', updateScrollIndicators);
      window.removeEventListener('resize', updateScrollIndicators);
    };
  }, [updateScrollIndicators, cards.length]);

  return (
    <div className="card-fan-wrapper" ref={wrapperRef}>
      <div className="card-fan" ref={scrollRef}>
        <div className="card-fan-inner">
        {cards.map((card) => {
          const icon = getSuitIcon(card.suit);
          const colorClass = getSuitColor(card.suit);

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
      </div>
    </div>
  );
};

