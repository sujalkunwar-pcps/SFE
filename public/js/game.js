/**
 * Banana Brain — Game Arena Controller
 * Manages the live challenge loop, interactive number pad, server-side answer verification,
 * timers, and animated gameplay feedback.
 */
import { api } from './api-client.js';
import { eventBus, CLIENT_EVENTS } from './event-bus.js';
import { showToast, setupNavigation } from './ui.js';

class GameEngine {
  constructor() {
    this.currentChallenge = null;
    this.timerInterval = null;
    this.timeRemainingSec = 180;
    this.isSubmitting = false;

    // DOM Elements
    this.hudScore = document.getElementById('hudScore');
    this.hudStreak = document.getElementById('hudStreak');
    this.hudAccuracy = document.getElementById('hudAccuracy');
    this.puzzleImage = document.getElementById('puzzleImage');
    this.puzzleLoading = document.getElementById('puzzleLoading');
    this.puzzleError = document.getElementById('puzzleError');
    this.answerInput = document.getElementById('answerInput');
    this.submitBtn = document.getElementById('submitBtn');
    this.nextBtn = document.getElementById('nextBtn');
    this.feedbackBanner = document.getElementById('feedbackBanner');
    this.feedbackContent = document.getElementById('feedbackContent');
    this.feedbackDetails = document.getElementById('feedbackDetails');
    this.timerBar = document.getElementById('timerBar');
    this.timerText = document.getElementById('timerText');
    this.numpadButtons = document.querySelectorAll('.numpad-btn');
  }

  async init() {
    const user = await setupNavigation();
    if (!user) {
      showToast('Please log in to play Banana Brain', 'info');
      setTimeout(() => window.location.href = '/login.html', 1000);
      return;
    }

    this.bindEvents();
    await this.refreshStats();
    await this.loadNewChallenge();
  }

  bindEvents() {
    // Submit Answer Button
    this.submitBtn?.addEventListener('click', () => this.handleAnswerSubmit());

    // Next Puzzle Button
    this.nextBtn?.addEventListener('click', () => this.loadNewChallenge());

    // Retry Button on error
    document.getElementById('retryBtn')?.addEventListener('click', () => this.loadNewChallenge());

    // Interactive Number Pad (0-9)
    this.numpadButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.getAttribute('data-val');
        if (this.answerInput && !this.isSubmitting && this.currentChallenge) {
          this.answerInput.value = val;
          this.handleAnswerSubmit();
        }
      });
    });

    // Keyboard support: Numbers 0-9 and Enter
    document.addEventListener('keydown', (e) => {
      // If feedback is showing and user presses Enter or Space, proceed to next challenge
      if (this.feedbackBanner && this.feedbackBanner.style.display === 'flex') {
        if (e.key === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          this.loadNewChallenge();
          return;
        }
      }

      // Enter to submit
      if (e.key === 'Enter' && !this.isSubmitting && this.answerInput?.value.trim() !== '') {
        e.preventDefault();
        this.handleAnswerSubmit();
      }

      // Quick numeric typing
      if (/^[0-9]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (this.answerInput && document.activeElement !== this.answerInput) {
          this.answerInput.value = e.key;
        }
      }
    });
  }

  async refreshStats() {
    try {
      const res = await api.get('/api/game/stats');
      if (res.success && res.stats) {
        const s = res.stats;
        if (this.hudScore) this.hudScore.textContent = s.totalScore.toLocaleString();
        if (this.hudStreak) this.hudStreak.textContent = `${s.currentStreak} 🔥`;
        if (this.hudAccuracy) this.hudAccuracy.textContent = `${s.accuracyPercentage}%`;
      }
    } catch (err) {
      console.warn('Could not fetch player stats:', err);
    }
  }

  async loadNewChallenge() {
    this.resetChallengeState();

    try {
      this.puzzleLoading.style.display = 'flex';
      this.puzzleImage.style.display = 'none';
      this.puzzleError.style.display = 'none';

      const res = await api.post('/api/game/challenges');
      if (res.success && res.challenge) {
        this.currentChallenge = res.challenge;

        // Preload puzzle image
        const img = new Image();
        img.src = res.challenge.imageUrl;
        img.onload = () => {
          this.puzzleLoading.style.display = 'none';
          this.puzzleImage.src = res.challenge.imageUrl;
          this.puzzleImage.style.display = 'block';
          this.answerInput.disabled = false;
          this.submitBtn.disabled = false;
          this.answerInput.focus();
          this.startTimer();
        };
        img.onerror = () => {
          throw new Error('Failed to render puzzle image from external provider');
        };
      }
    } catch (err) {
      this.puzzleLoading.style.display = 'none';
      this.puzzleError.style.display = 'flex';
      document.getElementById('errorMessage').textContent = err.message || 'Unable to load puzzle challenge.';
      showToast(err.message, 'error');
    }
  }

  resetChallengeState() {
    clearInterval(this.timerInterval);
    this.currentChallenge = null;
    this.isSubmitting = false;
    this.answerInput.value = '';
    this.answerInput.disabled = true;
    this.submitBtn.disabled = true;
    this.feedbackBanner.style.display = 'none';
    this.feedbackBanner.className = 'feedback-banner';
    this.timeRemainingSec = 180;
    this.updateTimerDisplay();
  }

  startTimer() {
    clearInterval(this.timerInterval);
    this.timeRemainingSec = 180;
    this.updateTimerDisplay();

    this.timerInterval = setInterval(() => {
      this.timeRemainingSec--;
      this.updateTimerDisplay();

      if (this.timeRemainingSec <= 0) {
        clearInterval(this.timerInterval);
        this.handleTimeExpired();
      }
    }, 1000);
  }

  updateTimerDisplay() {
    if (!this.timerBar || !this.timerText) return;

    const percent = Math.max(0, (this.timeRemainingSec / 180) * 100);
    this.timerBar.style.width = `${percent}%`;

    const mins = Math.floor(this.timeRemainingSec / 60);
    const secs = this.timeRemainingSec % 60;
    this.timerText.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    if (this.timeRemainingSec < 20) {
      this.timerBar.className = 'timer-bar danger';
    } else if (this.timeRemainingSec < 60) {
      this.timerBar.className = 'timer-bar warning';
    } else {
      this.timerBar.className = 'timer-bar';
    }
  }

  handleTimeExpired() {
    showToast('Time expired for this challenge!', 'info');
    this.answerInput.disabled = true;
    this.submitBtn.disabled = true;
    this.feedbackBanner.className = 'feedback-banner incorrect';
    this.feedbackBanner.style.display = 'flex';
    this.feedbackContent.innerHTML = '<span>⏱️ Time expired!</span>';
    this.feedbackDetails.textContent = 'Challenge expired after 3 minutes. Request a new puzzle to keep playing.';
  }

  async handleAnswerSubmit() {
    if (this.isSubmitting || !this.currentChallenge) return;

    const answer = this.answerInput.value.trim();
    if (answer === '') {
      showToast('Please enter an answer (0-9)', 'info');
      return;
    }

    clearInterval(this.timerInterval);
    this.isSubmitting = true;
    this.submitBtn.disabled = true;
    this.answerInput.disabled = true;

    try {
      const res = await api.post(`/api/game/challenges/${this.currentChallenge.id}/answer`, { answer });

      if (res.success) {
        if (res.correct) {
          // Correct Answer
          this.feedbackBanner.className = 'feedback-banner correct';
          this.feedbackBanner.style.display = 'flex';
          this.feedbackContent.innerHTML = `<span>🎉 Correct! +${res.pointsAwarded} pts</span>`;
          this.feedbackDetails.textContent = `Speed bonus: +${res.speedBonus} pts | Streak bonus: +${res.streakBonus} pts`;
          showToast(`Correct! +${res.pointsAwarded} points`, 'success');
        } else {
          // Incorrect Answer
          const stage = document.querySelector('.puzzle-stage');
          stage.classList.add('shake');
          setTimeout(() => stage.classList.remove('shake'), 500);

          this.feedbackBanner.className = 'feedback-banner incorrect';
          this.feedbackBanner.style.display = 'flex';
          this.feedbackContent.innerHTML = `<span>❌ Incorrect! Solution was: ${res.solution}</span>`;
          this.feedbackDetails.textContent = `Submitted: ${res.submittedAnswer} | Streak reset to 0.`;
          showToast(`Incorrect answer! Streak broken.`, 'error');
        }

        // Update HUD
        if (this.hudScore) this.hudScore.textContent = res.totalScore.toLocaleString();
        if (this.hudStreak) this.hudStreak.textContent = `${res.currentStreak} 🔥`;
        await this.refreshStats();
      }
    } catch (err) {
      showToast(err.message, 'error');
      this.isSubmitting = false;
      this.submitBtn.disabled = false;
      this.answerInput.disabled = false;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const engine = new GameEngine();
  engine.init();
});
