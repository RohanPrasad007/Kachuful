'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '../context/SocketContext';
import styles from './page.module.css';

export default function Home() {
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError('Please enter your name');
      return;
    }
    if (!socket) return;

    socket.emit('room:create', { hostName: name });
    socket.once('room:created', (data) => {
      sessionStorage.setItem(`session_${data.roomCode}`, data.sessionToken);
      sessionStorage.setItem('playerName', name);
      router.push(`/room/${data.roomCode}`);
    });
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !roomCode) {
      setError('Please enter your name and room code');
      return;
    }
    if (!socket) return;

    socket.emit('room:join', { roomCode: roomCode.toUpperCase(), playerName: name });
    
    // We set up listeners
    socket.once('room:joined', (data) => {
      sessionStorage.setItem(`session_${data.roomCode}`, data.sessionToken);
      sessionStorage.setItem('playerName', name);
      router.push(`/room/${data.roomCode}`);
    });

    socket.once('error', (err) => {
      setError(err.message);
    });
  };

  return (
    <div className="page-container" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <a href="/rules" style={{ position: 'absolute', top: '24px', right: '24px' }} className="material-symbols-outlined text-[#d5c4ab] hover:text-[#ffb800] transition-colors" title="How to play">
        help
      </a>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 className="main-title" style={{ fontSize: '4rem', color: 'var(--primary)', marginBottom: '16px' }}>Kachuful</h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--on-surface-variant)' }}>The ultimate trick-taking card game</p>
      </div>

      {!isConnected && (
        <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: 'var(--surface-variant)', borderRadius: '8px', border: '1px solid var(--outline-variant)' }}>
          <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ animation: 'spin 2s linear infinite' }}>sync</span>
            Waking up server, hang tight...
          </p>
        </div>
      )}

      {error && (
        <div style={{ color: 'var(--error)', marginBottom: '20px', padding: '12px', backgroundColor: 'var(--error-container)', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* Create Room */}
        <div style={{ backgroundColor: 'var(--surface-container)', padding: '32px', borderRadius: '16px', border: '1px solid var(--outline-variant)', width: '320px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '24px', color: 'var(--tertiary)' }}>Host a Game</h2>
          <form onSubmit={handleCreateRoom} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input 
              type="text" 
              placeholder="Your Name" 
              value={name}
              onChange={e => setName(e.target.value)}
              className={styles.input}
              maxLength={15}
            />
            <button type="submit" className="btn-primary" disabled={!isConnected}>Create Room</button>
          </form>
        </div>

        {/* Join Room */}
        <div style={{ backgroundColor: 'var(--surface-container)', padding: '32px', borderRadius: '16px', border: '1px solid var(--outline-variant)', width: '320px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '24px', color: 'var(--primary)' }}>Join a Game</h2>
          <form onSubmit={handleJoinRoom} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input 
              type="text" 
              placeholder="Your Name" 
              value={name}
              onChange={e => setName(e.target.value)}
              className={styles.input}
              maxLength={15}
            />
            <input 
              type="text" 
              placeholder="Room Code" 
              value={roomCode}
              onChange={e => setRoomCode(e.target.value)}
              className={styles.input}
              style={{ textTransform: 'uppercase' }}
              maxLength={6}
            />
            <button type="submit" className="btn-secondary" disabled={!isConnected}>Join Game</button>
          </form>
        </div>
      </div>
    </div>
  );
}
