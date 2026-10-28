/**
 * Banana Brain — Leaderboard Controller
 * Fetches and renders global competitive rankings, top-3 podiums, and player statistics.
 */
import { api } from './api-client.js';
import { setupNavigation, escapeHtml } from './ui.js';

document.addEventListener('DOMContentLoaded', async () => {
  await setupNavigation();
  await loadLeaderboard();
});

async function loadLeaderboard() {
  const tableBody = document.getElementById('leaderboardBody');
  const podiumContainer = document.getElementById('podiumContainer');
  const userRankCard = document.getElementById('userRankCard');

  try {
    const res = await api.get('/api/leaderboard?limit=50');
    if (res.success) {
      renderPodium(res.leaderboard.slice(0, 3), podiumContainer);
      renderTable(res.leaderboard, tableBody);

      if (res.currentUser && userRankCard) {
        renderCurrentUserCard(res.currentUser, userRankCard);
      }
    }
  } catch (err) {
    console.error('Failed to load leaderboard:', err);
    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">Unable to load leaderboard data.</td></tr>`;
    }
  }
}

function renderPodium(top3, container) {
  if (!container || top3.length === 0) return;

  const positions = [
    { rank: 2, class: 'second', medal: '🥈', badge: 'badge-silver' },
    { rank: 1, class: 'first', medal: '👑', badge: 'badge-gold' },
    { rank: 3, class: 'third', medal: '🥉', badge: 'badge-bronze' }
  ];

  container.innerHTML = positions.map(pos => {
    const player = top3.find(p => p.rank === pos.rank);
    if (!player) return '';

    return `
      <div class="podium-card ${pos.class}">
        <span class="podium-rank">${pos.medal}</span>
        <div class="avatar avatar-lg" style="background-color: ${player.avatarColor || '#F59E0B'};">
          ${player.displayName.substring(0, 2).toUpperCase()}
        </div>
        <h4 style="margin-top: 0.5rem;">${escapeHtml(player.displayName)}</h4>
        <span class="badge ${pos.badge}">Rank #${player.rank}</span>
        <div style="font-family: var(--font-mono); font-size: 1.5rem; font-weight: 800; color: var(--banana-400); margin-top: 0.25rem;">
          ${player.totalScore.toLocaleString()} pts
        </div>
        <span style="font-size: var(--font-size-xs); color: var(--text-muted);">
          Streak: ${player.bestStreak} 🔥 | ${player.accuracyPercentage}% Acc
        </span>
      </div>
    `;
  }).join('');
}

function renderTable(players, tbody) {
  if (!tbody) return;
  if (players.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">No players on the leaderboard yet. Be the first to score!</td></tr>`;
    return;
  }

  tbody.innerHTML = players.map(p => {
    const isCurrentClass = p.isCurrentUser ? 'highlight-user' : '';
    let medal = `#${p.rank}`;
    if (p.rank === 1) medal = '🥇 #1';
    else if (p.rank === 2) medal = '🥈 #2';
    else if (p.rank === 3) medal = '🥉 #3';

    return `
      <tr class="${isCurrentClass}">
        <td style="font-weight: 700; font-family: var(--font-mono);">${medal}</td>
        <td>
          <div style="display: flex; align-items: center; gap: var(--space-3);">
            <div class="avatar" style="background-color: ${p.avatarColor || '#F59E0B'};">
              ${p.displayName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div style="font-weight: 600;">${escapeHtml(p.displayName)}</div>
              <div style="font-size: var(--font-size-xs); color: var(--text-muted);">@${escapeHtml(p.username)}</div>
            </div>
          </div>
        </td>
        <td style="font-weight: 800; font-family: var(--font-mono); color: var(--banana-400); font-size: 1.1rem;">
          ${p.totalScore.toLocaleString()}
        </td>
        <td style="font-family: var(--font-mono);">${p.gamesPlayed}</td>
        <td>
          <span class="badge badge-success">${p.accuracyPercentage}%</span>
        </td>
        <td style="font-family: var(--font-mono);">${p.bestStreak} 🔥</td>
      </tr>
    `;
  }).join('');
}

function renderCurrentUserCard(user, container) {
  container.style.display = 'block';
  container.innerHTML = `
    <div class="card card-glass" style="display: flex; align-items: center; justify-content: space-between; border-left: 4px solid var(--banana-500); padding: 1rem 1.5rem; margin-bottom: 2rem;">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <div class="avatar" style="background-color: ${user.avatarColor || '#F59E0B'};">
          ${user.displayName.substring(0, 2).toUpperCase()}
        </div>
        <div>
          <div style="font-weight: 700; font-size: 1.1rem;">Your Current Standing: Rank #${user.rank}</div>
          <div style="font-size: 0.85rem; color: var(--text-secondary);">${escapeHtml(user.displayName)} (@${user.username})</div>
        </div>
      </div>
      <div style="display: flex; gap: 2rem; align-items: center;">
        <div style="text-align: right;">
          <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Score</div>
          <div style="font-family: var(--font-mono); font-size: 1.4rem; font-weight: 800; color: var(--banana-400);">${user.totalScore.toLocaleString()}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Accuracy</div>
          <div style="font-family: var(--font-mono); font-size: 1.4rem; font-weight: 800; color: var(--success);">${user.accuracyPercentage}%</div>
        </div>
      </div>
    </div>
  `;
}
