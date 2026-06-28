import React from 'react';

interface Player {
  name: string;
  seat: number;
}

interface RoundSummaryProps {
  players: Player[];
  bids: Record<number, number>;
  tricksWon: Record<number, number>;
  scoresThisRound: Record<number, number>;
  runningTotals: Record<number, number>;
  roundNumber: number;
}

export const RoundSummary: React.FC<RoundSummaryProps> = ({
  players,
  bids,
  tricksWon,
  scoresThisRound,
  runningTotals,
  roundNumber
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '40px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Round {roundNumber} Complete</p>
        <h1 style={{ fontSize: '3rem', color: 'var(--primary)' }}>Round Summary</h1>
      </div>

      <div style={{ width: '100%', maxWidth: '800px', backgroundColor: 'var(--surface-container)', borderRadius: '16px', border: '1px solid var(--outline-variant)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-variant)', color: 'var(--on-surface-variant)' }}>
              <th style={{ padding: '16px' }}>Player</th>
              <th style={{ padding: '16px' }}>Bid</th>
              <th style={{ padding: '16px' }}>Won</th>
              <th style={{ padding: '16px' }}>Round Score</th>
              <th style={{ padding: '16px', color: 'var(--primary)' }}>Total Score</th>
            </tr>
          </thead>
          <tbody>
            {players.map(p => {
              const madeBid = bids[p.seat] === tricksWon[p.seat];
              
              return (
                <tr key={p.seat} style={{ borderBottom: '1px solid rgba(81, 69, 50, 0.3)' }}>
                  <td style={{ padding: '16px', fontWeight: 'bold' }}>{p.name}</td>
                  <td style={{ padding: '16px' }}>{bids[p.seat]}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ 
                      display: 'inline-block', 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      backgroundColor: madeBid ? 'rgba(255,184,0,0.2)' : 'rgba(255,180,171,0.2)',
                      color: madeBid ? 'var(--primary)' : 'var(--error)'
                    }}>
                      {tricksWon[p.seat]}
                    </span>
                  </td>
                  <td style={{ padding: '16px', color: scoresThisRound[p.seat] > 0 ? 'var(--primary)' : 'var(--error)' }}>
                    +{scoresThisRound[p.seat]}
                  </td>
                  <td style={{ padding: '16px', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary)' }}>
                    {runningTotals[p.seat]}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '40px', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className="material-symbols-outlined" style={{ animation: 'spin 2s linear infinite' }}>sync</span>
        Starting next round shortly...
      </div>
    </div>
  );
};
