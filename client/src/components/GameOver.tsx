import React from 'react';

interface Player {
  name: string;
  seat: number;
}

interface GameOverProps {
  players: Player[];
  finalTotals: Record<number, number>;
  winningSeats: number[];
}

export const GameOver: React.FC<GameOverProps> = ({
  players,
  finalTotals,
  winningSeats
}) => {
  // Sort players by score descending
  const sortedPlayers = [...players].sort((a, b) => finalTotals[b.seat] - finalTotals[a.seat]);

  const winners = winningSeats.map(seat => players.find(p => p.seat === seat)?.name).join(', ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '40px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Game Over</p>
        <h1 style={{ fontSize: '3rem', color: 'var(--primary)' }}>Winner: {winners}</h1>
        <p style={{ color: 'var(--on-surface-variant)' }}>Congratulations!</p>
      </div>

      <div style={{ width: '100%', maxWidth: '600px', backgroundColor: 'var(--surface-container)', borderRadius: '16px', border: '1px solid var(--outline-variant)', overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--outline-variant)' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--on-surface)' }}>Final Scoreboard</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {sortedPlayers.map((p, index) => {
            const isWinner = winningSeats.includes(p.seat);
            return (
              <div key={p.seat} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '16px 24px',
                backgroundColor: isWinner ? 'rgba(255,184,0,0.1)' : 'transparent',
                borderBottom: index < sortedPlayers.length - 1 ? '1px solid rgba(81, 69, 50, 0.3)' : 'none'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ 
                    width: '32px', height: '32px', 
                    borderRadius: '50%', 
                    backgroundColor: isWinner ? 'var(--primary)' : 'var(--surface-variant)', 
                    color: isWinner ? 'var(--on-primary)' : 'var(--on-surface-variant)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    fontWeight: 'bold'
                  }}>
                    {index + 1}
                  </div>
                  <span style={{ fontSize: '1.2rem', fontWeight: isWinner ? 'bold' : 'normal' }}>{p.name}</span>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: isWinner ? 'var(--primary)' : 'var(--on-surface)' }}>
                  {finalTotals[p.seat]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: '40px' }}>
        <a href="/" className="btn-primary" style={{ display: 'inline-block' }}>Play Again</a>
      </div>
    </div>
  );
};
