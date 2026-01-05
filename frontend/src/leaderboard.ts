/**
 * Leaderboard rendering module
 */

import type { LeaderboardEntry } from './types';

/**
 * Get rank medal/badge
 */
function getRankBadge(rank: number): string {
  switch (rank) {
    case 1:
      return '<span class="rank-badge gold">1st</span>';
    case 2:
      return '<span class="rank-badge silver">2nd</span>';
    case 3:
      return '<span class="rank-badge bronze">3rd</span>';
    default:
      return `<span class="rank-badge">#${rank}</span>`;
  }
}

/**
 * Get success rate indicator
 */
function getSuccessRateIndicator(rate: number): string {
  if (rate >= 80) return '<span class="rate-dot excellent"></span>';
  if (rate >= 60) return '<span class="rate-dot good"></span>';
  if (rate >= 40) return '<span class="rate-dot average"></span>';
  if (rate > 0) return '<span class="rate-dot poor"></span>';
  return '<span class="rate-dot none"></span>';
}

/**
 * Get success rate class
 */
function getSuccessRateClass(rate: number): string {
  if (rate >= 80) return 'excellent';
  if (rate >= 60) return 'good';
  if (rate >= 40) return 'average';
  if (rate > 0) return 'poor';
  return 'none';
}

/**
 * Render leaderboard as HTML
 */
export function renderLeaderboard(entries: LeaderboardEntry[]): string {
  if (entries.length === 0) {
    return `
      <div class="leaderboard-empty">
        <div class="empty-placeholder">LEADERBOARD</div>
        <h3>No submissions yet</h3>
        <p>Be the first to solve a problem and claim the top spot!</p>
      </div>
    `;
  }

  // Calculate statistics
  const totalUsers = entries.length;
  const totalSolved = entries.reduce((sum, e) => sum + e.solved_count, 0);
  const totalSubmissions = entries.reduce((sum, e) => sum + e.total_submissions, 0);
  const avgSuccessRate = totalSubmissions > 0 
    ? Math.round((totalSolved / totalSubmissions) * 100)
    : 0;

  let html = `
    <div class="leaderboard-header">
      <h2>Leaderboard</h2>
      <div class="leaderboard-stats">
        <div class="stat-item">
          <span class="stat-value">${totalUsers}</span>
          <span class="stat-label">Users</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${totalSolved}</span>
          <span class="stat-label">Solved</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${avgSuccessRate}%</span>
          <span class="stat-label">Avg Rate</span>
        </div>
      </div>
    </div>
    <div class="leaderboard-list">
  `;

  entries.forEach((entry, idx) => {
    const rank = idx + 1;
    const successRate = entry.total_submissions > 0
      ? Math.round((entry.solved_count / entry.total_submissions) * 100)
      : 0;
    
    const indicator = getSuccessRateIndicator(successRate);
    const rateClass = getSuccessRateClass(successRate);
    const rankBadge = getRankBadge(rank);
    const isTopThree = rank <= 3;

    html += `
      <div class="leaderboard-item ${isTopThree ? 'top-three' : ''}" data-rank="${rank}">
        <div class="rank-column">
          ${rankBadge}
        </div>
        <div class="user-column">
          <div class="username">${entry.username}</div>
          <div class="user-stats">
            <span class="stat">Solved: ${entry.solved_count}</span>
            <span class="stat">Total: ${entry.total_submissions}</span>
          </div>
        </div>
        <div class="rate-column">
          <div class="success-rate ${rateClass}">
            ${indicator} ${successRate}%
          </div>
          <div class="rate-bar">
            <div class="rate-fill" style="width: ${successRate}%"></div>
          </div>
        </div>
      </div>
    `;
  });

  html += `
    </div>
  `;

  return html;
}

/**
 * Render leaderboard stats summary
 */
export function renderLeaderboardSummary(entries: LeaderboardEntry[]): string {
  if (entries.length === 0) {
    return '<p class="muted">No data available</p>';
  }

  const topUser = entries[0];
  const totalUsers = entries.length;
  const usersWithSolved = entries.filter(e => e.solved_count > 0).length;
  const participationRate = Math.round((usersWithSolved / totalUsers) * 100);

  return `
    <div class="leaderboard-summary">
      <div class="summary-item highlight">
        <div class="summary-icon">1st</div>
        <div class="summary-content">
          <div class="summary-label">Top Coder</div>
          <div class="summary-value">${topUser.username}</div>
          <div class="summary-detail">${topUser.solved_count} problems solved</div>
        </div>
      </div>
      <div class="summary-item">
        <div class="summary-icon">Stats</div>
        <div class="summary-content">
          <div class="summary-label">Participation</div>
          <div class="summary-value">${participationRate}%</div>
          <div class="summary-detail">${usersWithSolved} of ${totalUsers} users active</div>
        </div>
      </div>
    </div>
  `;
}

