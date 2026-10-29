/**
 * Banana Brain — User Profile & History Controller
 * Renders virtual identity details, performance statistics, and historical challenge records.
 */
import { api } from './api-client.js';
import { showToast, setupNavigation, escapeHtml } from './ui.js';

document.addEventListener('DOMContentLoaded', async () => {
  const user = await setupNavigation();
  if (!user) {
    showToast('Please log in to view your profile', 'info');
    setTimeout(() => window.location.href = '/login.html', 1000);
    return;
  }

  await loadProfile();
  await loadHistory();
  setupEditModal();
});

async function loadProfile() {
  try {
    const res = await api.get('/api/profile');
    if (res.success && res.user) {
      const u = res.user;
      const s = u.stats || {};

      // Profile Header Elements
      const avatarEl = document.getElementById('profileAvatar');
      const nameEl = document.getElementById('profileDisplayName');
      const usernameEl = document.getElementById('profileUsername');
      const bioEl = document.getElementById('profileBio');
      const createdEl = document.getElementById('profileCreatedAt');

      if (avatarEl) {
        avatarEl.style.backgroundColor = u.avatar_color || '#F59E0B';
        avatarEl.textContent = (u.display_name || u.username).substring(0, 2).toUpperCase();
      }
      if (nameEl) nameEl.textContent = u.display_name || u.username;
      if (usernameEl) usernameEl.textContent = `@${u.username}`;
      if (bioEl) bioEl.textContent = u.bio || 'No bio provided yet.';
      if (createdEl && u.created_at) {
        createdEl.textContent = `Member since ${new Date(u.created_at).toLocaleDateString()}`;
      }

      // Stats Counters
      const totalScoreEl = document.getElementById('statTotalScore');
      const gamesPlayedEl = document.getElementById('statGamesPlayed');
      const accuracyEl = document.getElementById('statAccuracy');
      const currentStreakEl = document.getElementById('statCurrentStreak');
      const bestStreakEl = document.getElementById('statBestStreak');

      const totalAttempts = (s.correct_answers || 0) + (s.incorrect_answers || 0);
      const acc = totalAttempts > 0 ? Math.round((s.correct_answers / totalAttempts) * 100) : 0;

      if (totalScoreEl) totalScoreEl.textContent = (s.total_score || 0).toLocaleString();
      if (gamesPlayedEl) gamesPlayedEl.textContent = s.games_played || 0;
      if (accuracyEl) accuracyEl.textContent = `${acc}%`;
      if (currentStreakEl) currentStreakEl.textContent = `${s.current_streak || 0} 🔥`;
      if (bestStreakEl) bestStreakEl.textContent = `${s.best_streak || 0} 🔥`;

      // Pre-fill edit modal form fields
      const editName = document.getElementById('editDisplayName');
      const editBio = document.getElementById('editBio');
      if (editName) editName.value = u.display_name || '';
      if (editBio) editBio.value = u.bio || '';
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadHistory() {
  const historyTbody = document.getElementById('historyTbody');
  if (!historyTbody) return;

  try {
    const res = await api.get('/api/game/history?limit=25');
    if (res.success) {
      if (res.history.length === 0) {
        historyTbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">No puzzles played yet. Go to Play Arena to start your first challenge!</td></tr>`;
        return;
      }

      historyTbody.innerHTML = res.history.map(att => {
        const statusBadge = att.isCorrect
          ? `<span class="badge badge-success">Correct (+${att.pointsAwarded})</span>`
          : `<span class="badge badge-danger">Incorrect (0)</span>`;

        return `
          <tr>
            <td>
              <img src="${att.imageUrl}" alt="Puzzle Thumbnail" style="width: 50px; height: 35px; object-fit: contain; background: #FFF; border-radius: 4px; padding: 2px;" />
            </td>
            <td>${statusBadge}</td>
            <td style="font-family: var(--font-mono); font-weight: 700;">${att.submittedAnswer}</td>
            <td style="font-family: var(--font-mono); color: var(--banana-400); font-weight: 700;">${att.solution}</td>
            <td style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-secondary);">${Math.round(att.responseTimeMs / 1000)}s</td>
            <td style="font-size: 0.85rem; color: var(--text-muted);">${new Date(att.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
          </tr>
        `;
      }).join('');
    }
  } catch (err) {
    historyTbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger); padding: 1.5rem;">Failed to load game history.</td></tr>`;
  }
}

function setupEditModal() {
  const modal = document.getElementById('editModal');
  const openBtn = document.getElementById('openEditModalBtn');
  const closeBtn = document.getElementById('closeEditModalBtn');
  const cancelBtn = document.getElementById('cancelEditBtn');
  const form = document.getElementById('editProfileForm');

  if (!modal) return;

  const toggleModal = (show) => {
    modal.style.display = show ? 'flex' : 'none';
  };

  openBtn?.addEventListener('click', () => toggleModal(true));
  closeBtn?.addEventListener('click', () => toggleModal(false));
  cancelBtn?.addEventListener('click', () => toggleModal(false));

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const displayName = document.getElementById('editDisplayName').value.trim();
    const bio = document.getElementById('editBio').value.trim();
    const avatarColor = document.querySelector('input[name="editAvatarColor"]:checked')?.value || '#F59E0B';

    try {
      await api.patch('/api/profile', { displayName, bio, avatarColor });
      showToast('Profile updated successfully', 'success');
      toggleModal(false);
      await loadProfile();
      await setupNavigation();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}
