import React from 'react';

interface Player {
  name: string;
  seat: number;
  connected: boolean;
}

interface LobbyViewProps {
  roomCode: string;
  players: Player[];
  hostName: string;
  isHost: boolean;
  onStartGame: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({ roomCode, players, hostName, isHost, onStartGame }) => {
  const canStart = players.length >= 3;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '40px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Room Code</p>
        <h1 style={{ fontSize: '4rem', color: 'var(--primary)', letterSpacing: '0.2em' }}>{roomCode}</h1>
        <p style={{ color: 'var(--on-surface-variant)' }}>Share this code with your friends to join.</p>
      </div>

      <div style={{ width: '100%', maxWidth: '600px', backgroundColor: 'var(--surface-container)', borderRadius: '16px', border: '1px solid var(--outline-variant)', overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--outline-variant)' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--on-surface)' }}>Players ({players.length}/10)</h2>
        </div>
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {players.map(p => (
            <div key={p.seat} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', backgroundColor: 'var(--surface-variant)', borderRadius: '8px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--primary-container)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--on-primary-container)', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {p.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--on-surface)' }}>{p.name} {p.name === hostName ? '(Host)' : ''}</div>
                <div style={{ color: p.connected ? 'var(--primary)' : 'var(--error)', fontSize: '0.9rem' }}>
                  {p.connected ? 'Connected' : 'Disconnected'}
                </div>
              </div>
            </div>
          ))}
          
          {players.length < 3 && (
            <div style={{ textAlign: 'center', color: 'var(--on-surface-variant)', padding: '16px' }}>
              Waiting for at least {3 - players.length} more player(s) to start...
            </div>
          )}
        </div>
      </div>

      {isHost && (
        <div style={{ marginTop: '40px' }}>
          <button 
            className="btn-primary" 
            onClick={onStartGame} 
            disabled={!canStart}
            style={{ opacity: canStart ? 1 : 0.5 }}
          >
            Start Game
          </button>
        </div>
      )}
      {!isHost && (
        <div style={{ marginTop: '40px', color: 'var(--on-surface-variant)' }}>
          Waiting for host ({hostName}) to start the game...
        </div>
      )}
    </div>
  );
};
