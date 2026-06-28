import React from 'react';

export default function RulesPage() {
  return (
    <div className="page-container" style={{ maxWidth: '800px', backgroundColor: 'var(--surface-container)', margin: '40px auto', padding: '40px', borderRadius: '16px', border: '1px solid var(--outline-variant)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: 'var(--primary)', fontSize: '3rem' }}>How to Play Kachuful</h1>
        <a href="/" className="btn-secondary">Back</a>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', color: 'var(--on-surface-variant)', lineHeight: '1.6', fontSize: '1.1rem' }}>
        <section>
          <h2 style={{ color: 'var(--on-surface)', fontSize: '1.8rem', marginBottom: '16px' }}>Overview</h2>
          <p>Kachuful (also known as Judgement or Oh Hell) is a trick-taking card game for 3 to 10 players using a standard 52-card deck.</p>
          <p>The goal is to exactly predict the number of tricks you will win in each round. If you win the exact number of tricks you bid, you get points. If you win more or fewer, you get 0 points.</p>
        </section>

        <section>
          <h2 style={{ color: 'var(--on-surface)', fontSize: '1.8rem', marginBottom: '16px' }}>Rounds & Dealing</h2>
          <p>The number of cards dealt changes each round. It starts at 1, goes up to a maximum (depending on player count), and then goes back down to 1.</p>
          <p>The deck is shuffled and newly dealt every single round. Any undealt cards are set aside.</p>
        </section>

        <section>
          <h2 style={{ color: 'var(--on-surface)', fontSize: '1.8rem', marginBottom: '16px' }}>Trump Suit</h2>
          <p>The trump suit changes every round in a fixed order: <strong>Spades → Diamonds → Clubs → Hearts</strong>, and then repeats.</p>
          <p>A card of the trump suit beats any card of any other suit.</p>
        </section>

        <section>
          <h2 style={{ color: 'var(--on-surface)', fontSize: '1.8rem', marginBottom: '16px' }}>Bidding</h2>
          <p>After looking at your hand, you must bid how many tricks you think you will win.</p>
          <p>Bidding goes in order, starting to the left of the dealer. The dealer bids last.</p>
          <p style={{ padding: '16px', backgroundColor: 'rgba(255,180,171,0.1)', borderRadius: '8px', border: '1px solid rgba(255,180,171,0.3)', marginTop: '8px', color: 'var(--error)' }}>
            <strong>The Dealer Restriction:</strong> The sum of all bids cannot equal the total number of cards dealt that round. This ensures that at least one person will fail their bid. The dealer is forbidden from making the bid that would cause the sum to equal the card count.
          </p>
        </section>

        <section>
          <h2 style={{ color: 'var(--on-surface)', fontSize: '1.8rem', marginBottom: '16px' }}>Playing a Trick</h2>
          <ul style={{ listStyleType: 'disc', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>The player left of the dealer leads the first trick.</li>
            <li>You <strong>must</strong> follow the lead suit if you have it.</li>
            <li>If you do not have the lead suit, you may play any card (including a trump).</li>
            <li>The highest trump card wins the trick. If no trumps are played, the highest card of the lead suit wins.</li>
            <li>The winner of the trick leads the next one.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ color: 'var(--on-surface)', fontSize: '1.8rem', marginBottom: '16px' }}>Scoring</h2>
          <p>If you win <strong>exactly</strong> the number of tricks you bid:</p>
          <div style={{ fontSize: '1.5rem', color: 'var(--primary)', fontWeight: 'bold', margin: '8px 0' }}>Score = 10 + Your Bid</div>
          <p>If you win any other number of tricks (higher or lower):</p>
          <div style={{ fontSize: '1.5rem', color: 'var(--error)', fontWeight: 'bold', margin: '8px 0' }}>Score = 0</div>
        </section>
      </div>
    </div>
  );
}
