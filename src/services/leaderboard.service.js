/**
 * Banana Brain — Leaderboard Service
 * Calculates global player rankings, score aggregations, and relative position.
 */
import { gameRepository } from '../repositories/game.repository.js';
import { gameService } from './game.service.js';

export class LeaderboardService {
  async getLeaderboard(limit = 25, currentUserId = null) {
    const topPlayers = await gameRepository.getLeaderboard(limit);

    // Attach dynamic 1-based ranks
    const rankedPlayers = topPlayers.map((player, index) => ({
      rank: index + 1,
      userId: player.user_id,
      username: player.username,
      displayName: player.display_name,
      avatarColor: player.avatar_color,
      totalScore: player.total_score,
      gamesPlayed: player.games_played,
      correctAnswers: player.correct_answers,
      incorrectAnswers: player.incorrect_answers,
      accuracyPercentage: player.accuracy_percentage,
      bestStreak: player.best_streak,
      currentStreak: player.current_streak,
      isCurrentUser: currentUserId ? player.user_id === currentUserId : false
    }));

    // Check if the current user is present in top ranked list
    let currentUserCard = null;
    if (currentUserId) {
      const foundInTop = rankedPlayers.find(p => p.userId === currentUserId);
      if (foundInTop) {
        currentUserCard = foundInTop;
      } else {
        const userStats = await gameService.getUserStats(currentUserId);
        if (userStats) {
          currentUserCard = {
            rank: userStats.rank,
            userId: userStats.userId,
            username: userStats.username,
            displayName: userStats.displayName,
            avatarColor: userStats.avatarColor,
            totalScore: userStats.totalScore,
            gamesPlayed: userStats.gamesPlayed,
            correctAnswers: userStats.correctAnswers,
            incorrectAnswers: userStats.incorrectAnswers,
            accuracyPercentage: userStats.accuracyPercentage,
            bestStreak: userStats.bestStreak,
            currentStreak: userStats.currentStreak,
            isCurrentUser: true
          };
        }
      }
    }

    return {
      success: true,
      count: rankedPlayers.length,
      leaderboard: rankedPlayers,
      currentUser: currentUserCard
    };
  }
}

export const leaderboardService = new LeaderboardService();
