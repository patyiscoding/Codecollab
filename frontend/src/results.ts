/**
 * Results rendering module
 */

import type { SubmissionResponse, CaseResult } from './types';

/**
 * Get status badge HTML
 */
function getStatusBadge(status: string): string {
  const badges: Record<string, { label: string; class: string }> = {
    AC: { label: 'Accepted', class: 'success' },
    WA: { label: 'Wrong Answer', class: 'error' },
    TLE: { label: 'Time Limit Exceeded', class: 'warning' },
    RE: { label: 'Runtime Error', class: 'error' },
    CE: { label: 'Compile Error', class: 'warning' }
  };

  const badge = badges[status] || { label: status, class: 'default' };
  return `<span class="status-badge ${badge.class}">${badge.label}</span>`;
}

/**
 * Get case status label
 */
function getCaseStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    AC: 'AC',
    WA: 'WA',
    TLE: 'TLE',
    RE: 'RE',
    CE: 'CE'
  };
  return labels[status] || status;
}

/**
 * Render test case
 */
function renderTestCase(caseResult: CaseResult): string {
  const label = getCaseStatusLabel(caseResult.status);
  const statusClass = caseResult.status === 'AC' ? 'success' : 'error';

  let html = `
    <div class="test-case ${statusClass}">
      <div class="test-case-header">
        <span class="test-case-title"><span class="case-status-label ${statusClass}">${label}</span> Test Case ${caseResult.index + 1}</span>
        <span class="test-case-time">${caseResult.time_ms}ms</span>
      </div>
  `;

  // Input
  if (caseResult.input) {
    const inputPreview = caseResult.input.length > 100 
      ? caseResult.input.substring(0, 100) + '...'
      : caseResult.input;
    html += `
      <div class="test-case-row">
        <span class="test-case-label">Input:</span>
        <code class="test-case-value">${escapeHtml(inputPreview)}</code>
      </div>
    `;
  }

  // Output based on status
  if (caseResult.status === 'AC') {
    const outputPreview = caseResult.stdout.length > 100
      ? caseResult.stdout.substring(0, 100) + '...'
      : caseResult.stdout;
    html += `
      <div class="test-case-row">
        <span class="test-case-label">Output:</span>
        <code class="test-case-value success-text">${escapeHtml(outputPreview)}</code>
      </div>
    `;
  } else if (caseResult.status === 'WA') {
    const yourOutput = caseResult.stdout.length > 80
      ? caseResult.stdout.substring(0, 80) + '...'
      : caseResult.stdout;
    const expected = (caseResult.expected || '').length > 80
      ? (caseResult.expected || '').substring(0, 80) + '...'
      : (caseResult.expected || '');
    
    html += `
      <div class="test-case-row">
        <span class="test-case-label">Your Output:</span>
        <code class="test-case-value error-text">${escapeHtml(yourOutput)}</code>
      </div>
      <div class="test-case-row">
        <span class="test-case-label">Expected:</span>
        <code class="test-case-value success-text">${escapeHtml(expected)}</code>
      </div>
    `;
  } else if (caseResult.status === 'RE' || caseResult.status === 'CE') {
    if (caseResult.stderr) {
      const errorPreview = caseResult.stderr.length > 200
        ? caseResult.stderr.substring(0, 200) + '...'
        : caseResult.stderr;
      html += `
        <div class="test-case-row error">
          <span class="test-case-label">Error:</span>
          <code class="test-case-value error-text">${escapeHtml(errorPreview)}</code>
        </div>
      `;
    }
  } else if (caseResult.status === 'TLE') {
    html += `
      <div class="test-case-row warning">
        <span class="test-case-label">Status:</span>
        <span class="test-case-value">Time limit exceeded</span>
      </div>
    `;
  }

  html += `</div>`;
  return html;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Render submission result as HTML
 */
export function renderResult(response: SubmissionResponse): string {
  const { submission_id, result } = response;
  const passRate = result.total > 0 
    ? Math.round((result.passed / result.total) * 100)
    : 0;

  let html = `
    <div class="result-container">
      <div class="result-header">
        <div class="result-title">
          ${getStatusBadge(result.status)}
          <span class="submission-id">ID: ${submission_id}</span>
        </div>
        <div class="result-stats">
          <div class="stat-chip">
            <span class="stat-label">Passed:</span>
            <span class="stat-text">${result.passed}/${result.total}</span>
          </div>
          <div class="stat-chip">
            <span class="stat-label">Rate:</span>
            <span class="stat-text">${passRate}%</span>
          </div>
          <div class="stat-chip">
            <span class="stat-label">Time:</span>
            <span class="stat-text">${result.time_ms}ms</span>
          </div>
        </div>
      </div>

      <div class="progress-bar">
        <div class="progress-fill ${result.status === 'AC' ? 'success' : 'partial'}" 
             style="width: ${passRate}%"></div>
      </div>
  `;

  // Test cases
  if (result.cases && result.cases.length > 0) {
    html += `
      <div class="test-cases-section">
        <h3 class="section-title">Test Cases</h3>
        <div class="test-cases-list">
    `;

    for (const caseResult of result.cases) {
      html += renderTestCase(caseResult);
    }

    html += `
        </div>
      </div>
    `;
  }

  html += `</div>`;
  return html;
}

/**
 * Render loading state
 */
export function renderResultLoading(): string {
  return `
    <div class="result-loading">
      <div class="spinner-large"></div>
      <h3>Judging your submission...</h3>
      <p class="muted">Running test cases and evaluating your code</p>
    </div>
  `;
}

/**
 * Render empty state
 */
export function renderResultEmpty(): string {
  return `
    <div class="result-empty">
      <div class="empty-placeholder">RESULTS</div>
      <h3>No submission yet</h3>
      <p class="muted">Submit your code to see the results here</p>
    </div>
  `;
}

