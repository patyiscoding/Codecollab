/**
 * Utility functions for formatting and displaying data
 */

import type { SubmissionResponse, LeaderboardEntry } from './types';

/**
 * Set text content of an element (supports objects via JSON.stringify)
 */
export function setText(element: HTMLElement | null, content: unknown): void {
  if (!element) return;
  element.textContent = typeof content === 'string' 
    ? content 
    : JSON.stringify(content, null, 2);
}

/**
 * Get status emoji and color
 */
function getStatusInfo(status: string): { emoji: string; color: string; label: string } {
  switch (status) {
    case 'AC':
      return { emoji: '✅', color: '#4ade80', label: 'Accepted' };
    case 'WA':
      return { emoji: '❌', color: '#f87171', label: 'Wrong Answer' };
    case 'TLE':
      return { emoji: '⏱️', color: '#fbbf24', label: 'Time Limit' };
    case 'RE':
      return { emoji: '💥', color: '#f87171', label: 'Runtime Error' };
    case 'CE':
      return { emoji: '⚠️', color: '#fbbf24', label: 'Compile Error' };
    default:
      return { emoji: '❓', color: '#a8b0d6', label: status };
  }
}

/**
 * Format submission result for display (plain text with better formatting)
 */
export function formatResult(res: SubmissionResponse): string {
  const statusInfo = getStatusInfo(res.result.status);
  const passRate = Math.round((res.result.passed / res.result.total) * 100);
  
  let out = '═'.repeat(60) + '\n';
  out += `${statusInfo.emoji} SUBMISSION RESULT\n`;
  out += '═'.repeat(60) + '\n\n';
  
  out += `ID: ${res.submission_id}\n`;
  out += `Status: ${statusInfo.emoji} ${statusInfo.label}\n`;
  out += `Passed: ${res.result.passed}/${res.result.total} (${passRate}%)\n`;
  out += `Total Time: ${res.result.time_ms}ms\n\n`;
  
  if (res.result.cases && res.result.cases.length > 0) {
    out += '─'.repeat(60) + '\n';
    out += 'TEST CASES\n';
    out += '─'.repeat(60) + '\n\n';
    
    for (const c of res.result.cases) {
      const caseInfo = getStatusInfo(c.status);
      out += `${caseInfo.emoji} Case ${c.index + 1}: ${caseInfo.label} (${c.time_ms}ms)\n`;
      
      if (c.input) {
        const inputPreview = c.input.substring(0, 100).replace(/\n/g, ' ').trim();
        out += `   📥 Input: ${inputPreview}\n`;
      }
      
      if (c.status === 'AC') {
        const outputPreview = c.stdout.substring(0, 100).replace(/\n/g, ' ').trim();
        out += `   📤 Output: ${outputPreview}\n`;
      } else if (c.status === 'WA') {
        const yourOutput = c.stdout.substring(0, 80).replace(/\n/g, ' ').trim();
        const expected = (c.expected || '').substring(0, 80).replace(/\n/g, ' ').trim();
        out += `   📤 Your: ${yourOutput}\n`;
        out += `   ✨ Expected: ${expected}\n`;
      } else if (c.status === 'RE' || c.status === 'CE') {
        if (c.stderr) {
          const errorPreview = c.stderr.substring(0, 150).replace(/\n/g, ' ');
          out += `   ⚠️  Error: ${errorPreview}\n`;
        }
      } else if (c.status === 'TLE') {
        out += `   ⏱️  Time Limit Exceeded\n`;
      }
      out += '\n';
    }
  }
  
  out += '═'.repeat(60) + '\n';
  
  return out;
}

/**
 * Get rank emoji
 */
function getRankEmoji(rank: number): string {
  switch (rank) {
    case 1:
      return '🥇';
    case 2:
      return '🥈';
    case 3:
      return '🥉';
    default:
      return '  ';
  }
}

/**
 * Format leaderboard data for display
 */
export function formatLeaderboard(entries: LeaderboardEntry[]): string {
  if (entries.length === 0) {
    return '📊 Leaderboard\n\n🎯 No submissions yet. Be the first!';
  }
  
  let out = '═'.repeat(65) + '\n';
  out += '🏆 LEADERBOARD - TOP CODERS\n';
  out += '═'.repeat(65) + '\n\n';
  out += 'Rank  Username       Solved    Submissions    Success Rate\n';
  out += '─'.repeat(65) + '\n';
  
  entries.forEach((entry, idx) => {
    const rank = idx + 1;
    const emoji = getRankEmoji(rank);
    const rankStr = `${emoji} ${String(rank).padStart(2)}`;
    const username = entry.username.substring(0, 12).padEnd(12);
    const solved = String(entry.solved_count).padStart(3);
    const total = String(entry.total_submissions).padStart(6);
    const successRate = entry.total_submissions > 0 
      ? Math.round((entry.solved_count / entry.total_submissions) * 100)
      : 0;
    const rateStr = `${String(successRate).padStart(3)}%`;
    
    // Add color indicator
    let indicator = '●';
    if (successRate >= 80) indicator = '🟢';
    else if (successRate >= 60) indicator = '🟡';
    else if (successRate >= 40) indicator = '🟠';
    else if (successRate > 0) indicator = '🔴';
    else indicator = '⚪';
    
    out += `${rankStr}    ${username}    ${solved}        ${total}          ${indicator} ${rateStr}\n`;
  });
  
  out += '─'.repeat(65) + '\n';
  out += `\n📈 Total Users: ${entries.length}\n`;
  
  return out;
}

/**
 * Format submission history for display
 */
export function formatHistory(username: string, submissions: SubmissionResponse[]): string {
  if (submissions.length === 0) {
    return `═${'═'.repeat(60)}\n📜 SUBMISSION HISTORY\n═${'═'.repeat(60)}\n\n` +
           `❌ No submissions found for user: ${username}\n\n` +
           `💡 Tip: Submit your first solution to see your history here!`;
  }
  
  let out = '═'.repeat(65) + '\n';
  out += `📜 SUBMISSION HISTORY - ${username}\n`;
  out += '═'.repeat(65) + '\n\n';
  
  // Calculate statistics
  const totalAC = submissions.filter(s => s.result.status === 'AC').length;
  const successRate = Math.round((totalAC / submissions.length) * 100);
  
  out += `Total Submissions: ${submissions.length} | `;
  out += `Accepted: ${totalAC} | `;
  out += `Success Rate: ${successRate}%\n\n`;
  out += '─'.repeat(65) + '\n\n';
  
  submissions.forEach((s, idx) => {
    const statusInfo = getStatusInfo(s.result.status);
    const date = s.timestamp ? new Date(s.timestamp * 1000).toLocaleString() : 'N/A';
    const passRate = Math.round((s.result.passed / s.result.total) * 100);
    
    out += `${statusInfo.emoji} #${idx + 1} ${statusInfo.label}\n`;
    out += `   🆔 ${s.submission_id}\n`;
    out += `   📝 Problem: ${(s as any).problem_id || 'Unknown'}\n`;
    out += `   📊 Passed: ${s.result.passed}/${s.result.total} (${passRate}%)\n`;
    out += `   ⏱️  Time: ${s.result.time_ms}ms\n`;
    out += `   📅 ${date}\n\n`;
  });
  
  out += '─'.repeat(65) + '\n';
  
  return out;
}

