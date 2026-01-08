/**
 * CodeCollab MVP - Main Application
 * Vite + TypeScript frontend for online code judging
 */

import './style.css';
import {
  initApiBase,
  saveApiBase,
  getApiBase,
  fetchProblems,
  fetchProblem,
  submitCode,
  fetchLeaderboard,
  fetchUserSubmissions
} from './api';
import { getTemplate } from './templates';
import { setText, formatHistory } from './utils';
import {
  register,
  login,
  getCurrentUser,
  logout as authLogout,
  getStoredToken,
  storeToken,
  removeToken
} from './auth-api';
import {
  initMonacoEditor,
  getEditorValue,
  setEditorValue,
  setEditorLanguage
} from './editor';
import { toast } from './toast';
import { renderLeaderboard } from './leaderboard';
import { renderResult, renderResultLoading, renderResultEmpty } from './results';
import type { Language, AuthState } from './types';

// Global authentication state
let authState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null
};

/**
 * DOM element references
 */
interface Elements {
  apiBase: HTMLInputElement;
  language: HTMLSelectElement;
  reload: HTMLButtonElement;
  problemSelect: HTMLSelectElement;
  statement: HTMLPreElement;
  loadTemplate: HTMLButtonElement;
  submit: HTMLButtonElement;
  viewHistory: HTMLButtonElement;
  result: HTMLDivElement;
  leaderboard: HTMLDivElement;
  authStatus: HTMLDivElement;
  editorContainer: HTMLDivElement;
}

/**
 * Get all DOM element references
 */
function getElements(): Elements {
  const $ = <T extends HTMLElement>(id: string): T => {
    const el = document.getElementById(id) as T | null;
    if (!el) throw new Error(`Element #${id} not found`);
    return el;
  };

  return {
    apiBase: $<HTMLInputElement>('apiBase'),
    language: $<HTMLSelectElement>('language'),
    reload: $<HTMLButtonElement>('reload'),
    problemSelect: $<HTMLSelectElement>('problemSelect'),
    statement: $<HTMLPreElement>('statement'),
    loadTemplate: $<HTMLButtonElement>('loadTemplate'),
    submit: $<HTMLButtonElement>('submit'),
    viewHistory: $<HTMLButtonElement>('viewHistory'),
    result: $<HTMLDivElement>('result'),
    leaderboard: $<HTMLDivElement>('leaderboard'),
    authStatus: $<HTMLDivElement>('authStatus'),
    editorContainer: $<HTMLDivElement>('editor-container')
  };
}

/**
 * Update authentication UI
 */
function updateAuthUI(els: Elements): void {
  if (authState.isAuthenticated && authState.user) {
    els.authStatus.innerHTML = `
      <span>Logged in as <span class="username">${authState.user.username}</span></span>
      <button id="logoutBtn" class="btn">Logout</button>
    `;
    
    // Add logout handler
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        authLogout();
        removeToken();
        authState = { isAuthenticated: false, user: null, token: null };
        updateAuthUI(els);
        setText(els.result, 'Logged out successfully');
      });
    }
  } else {
    els.authStatus.innerHTML = `
      <button id="loginBtn" class="btn primary">Login</button>
      <button id="registerBtn" class="btn">Register</button>
    `;
    
    // Add login/register handlers
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    
    if (loginBtn) {
      loginBtn.addEventListener('click', () => showAuthModal(els, 'login'));
    }
    if (registerBtn) {
      registerBtn.addEventListener('click', () => showAuthModal(els, 'register'));
    }
  }
}

/**
 * Show authentication modal
 */
function showAuthModal(els: Elements, mode: 'login' | 'register'): void {
  const modal = document.getElementById('authModal') as HTMLDivElement;
  const title = document.getElementById('authModalTitle') as HTMLHeadingElement;
  const form = document.getElementById('authForm') as HTMLFormElement;
  const usernameInput = document.getElementById('authUsername') as HTMLInputElement;
  const passwordInput = document.getElementById('authPassword') as HTMLInputElement;
  const errorDiv = document.getElementById('authError') as HTMLDivElement;
  const cancelBtn = document.getElementById('authCancel') as HTMLButtonElement;
  const toggleBtn = document.getElementById('authToggle') as HTMLButtonElement;
  
  // Set mode
  title.textContent = mode === 'login' ? 'Login' : 'Register';
  toggleBtn.textContent = mode === 'login' ? 'Need an account? Register' : 'Have an account? Login';
  errorDiv.style.display = 'none';
  errorDiv.textContent = '';
  form.reset();
  
  // Show modal
  modal.style.display = 'flex';
  
  // Handle form submission
  form.onsubmit = async (e) => {
    e.preventDefault();
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
    
    const credentials = {
      username: usernameInput.value,
      password: passwordInput.value
    };
    
    try {
      const authFunc = mode === 'login' ? login : register;
      const tokenResponse = await authFunc(credentials);
      
      // Store token
      storeToken(tokenResponse.access_token);
      authState.token = tokenResponse.access_token;
      
      // Get user info
      const user = await getCurrentUser(tokenResponse.access_token);
      authState.user = user;
      authState.isAuthenticated = true;
      
      // Update UI
      updateAuthUI(els);
      modal.style.display = 'none';
      setText(els.result, `Successfully ${mode === 'login' ? 'logged in' : 'registered'} as ${user.username}`);
    } catch (error) {
      errorDiv.style.display = 'block';
      errorDiv.textContent = String(error);
    }
  };
  
  // Handle cancel
  cancelBtn.onclick = () => {
    modal.style.display = 'none';
  };
  
  // Handle toggle
  toggleBtn.onclick = () => {
    modal.style.display = 'none';
    setTimeout(() => showAuthModal(els, mode === 'login' ? 'register' : 'login'), 100);
  };
  
  // Close on background click
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  };
}

/**
 * Check authentication status on startup
 */
async function checkAuth(els: Elements): Promise<void> {
  const token = getStoredToken();
  if (!token) {
    updateAuthUI(els);
    return;
  }
  
  try {
    const user = await getCurrentUser(token);
    authState = {
      isAuthenticated: true,
      user,
      token
    };
  } catch (error) {
    // Token invalid, remove it
    removeToken();
    authState = {
      isAuthenticated: false,
      user: null,
      token: null
    };
  }
  
  updateAuthUI(els);
}

/**
 * Load all problems from backend
 */
async function loadProblems(els: Elements): Promise<void> {
  setText(els.result, '');
  setText(els.statement, 'Loading problems...');
  els.problemSelect.innerHTML = '';

  const problems = await fetchProblems();

  for (const p of problems) {
    const option = document.createElement('option');
    option.value = p.id;
    option.textContent = `${p.title} (${p.id})`;
    els.problemSelect.appendChild(option);
  }

  if (problems.length === 0) {
    setText(els.statement, 'No problems found on server.');
    return;
  }

  await loadProblem(els, problems[0].id);
}

/**
 * Load a specific problem by ID
 */
async function loadProblem(els: Elements, problemId: string): Promise<void> {
  const p = await fetchProblem(problemId);
  
  if ('error' in (p as any)) {
    setText(els.statement, `Error: ${(p as any).error}`);
    return;
  }

  const statement = `${p.title}\n\n${p.statement}\n\nTime limit: ${p.time_limit_ms}ms`;
  setText(els.statement, statement);
}

/**
 * Refresh leaderboard data
 */
async function refreshLeaderboard(els: Elements): Promise<void> {
  const entries = await fetchLeaderboard();
  els.leaderboard.innerHTML = renderLeaderboard(entries);
}

/**
 * Handle code submission
 */
async function handleSubmit(els: Elements): Promise<void> {
  // Check authentication
  if (!authState.isAuthenticated || !authState.user) {
    toast.error('Authentication Required', 'Please login to submit code');
    showAuthModal(els, 'login');
    return;
  }

  // Add loading state
  els.submit.classList.add('loading');
  els.submit.disabled = true;
  els.result.innerHTML = renderResultLoading();

  try {
    const problemId = els.problemSelect.value;
    const language = els.language.value as Language;
    const sourceCode = getEditorValue();

    const response = await submitCode({
      username: authState.user.username,
      problem_id: problemId,
      language,
      source_code: sourceCode
    });

    els.result.innerHTML = renderResult(response);
    
    // Show toast based on result
    if (response.result.status === 'AC') {
      toast.success('Accepted!', `All ${response.result.passed} test cases passed in ${response.result.time_ms}ms`);
    } else if (response.result.status === 'WA') {
      toast.error('Wrong Answer', `Passed ${response.result.passed}/${response.result.total} test cases`);
    } else if (response.result.status === 'TLE') {
      toast.error('Time Limit Exceeded', 'Your code took too long to execute');
    } else if (response.result.status === 'RE') {
      toast.error('Runtime Error', 'Your code crashed during execution');
    } else if (response.result.status === 'CE') {
      toast.error('Compile Error', 'Your code has syntax errors');
    }

    await refreshLeaderboard(els);
  } catch (error) {
      els.result.innerHTML = `
        <div class="result-empty">
          <div class="empty-placeholder">ERROR</div>
          <h3>Submission Error</h3>
          <p class="muted">${error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      `;
    toast.error('Submission Failed', 'Could not submit your code');
  } finally {
    // Remove loading state
    els.submit.classList.remove('loading');
    els.submit.disabled = false;
  }
}

/**
 * Handle view submission history
 */
async function handleViewHistory(els: Elements): Promise<void> {
  // Use authenticated user's username if logged in
  const username = authState.user?.username || els.username.value || 'anonymous';
  const submissions = await fetchUserSubmissions(username);
  const historyText = formatHistory(username, submissions);
  
  // Display history in result area with proper formatting
  els.result.innerHTML = `
    <div class="result-container">
      <div class="result-header">
        <div class="result-title">
          <span class="status-badge default">Submission History</span>
        </div>
      </div>
      <pre class="mono" style="margin-top: 16px;">${historyText}</pre>
    </div>
  `;
}

/**
 * Setup event listeners
 */
function setupEventListeners(els: Elements): void {
  // Reload problems and leaderboard
  els.reload.addEventListener('click', async () => {
    try {
      saveApiBase();
      await loadProblems(els);
      await refreshLeaderboard(els);
    } catch (error) {
      setText(els.result, `Failed: ${String(error)}`);
    }
  });

  // Change problem
  els.problemSelect.addEventListener('change', async () => {
    try {
      await loadProblem(els, els.problemSelect.value);
    } catch (error) {
      setText(els.result, `Failed: ${String(error)}`);
    }
  });

  // Change language - update template and editor
  els.language.addEventListener('change', () => {
    const problemId = els.problemSelect.value;
    const language = els.language.value as Language;
    setEditorLanguage(language);
    setEditorValue(getTemplate(problemId, language));
  });

  // Load template
  els.loadTemplate.addEventListener('click', () => {
    const problemId = els.problemSelect.value;
    const language = els.language.value as Language;
    setEditorValue(getTemplate(problemId, language));
  });

  // Submit code
  els.submit.addEventListener('click', async () => {
    try {
      await handleSubmit(els);
    } catch (error) {
      setText(els.result, `Failed: ${String(error)}`);
    }
  });

  // View submission history
  els.viewHistory.addEventListener('click', async () => {
    try {
      await handleViewHistory(els);
    } catch (error) {
      els.result.innerHTML = `
        <div class="result-empty">
          <div class="empty-placeholder">ERROR</div>
          <h3>Failed to Load History</h3>
          <p class="muted">${String(error)}</p>
        </div>
      `;
    }
  });
}

/**
 * Initialize and boot the application
 */
async function boot(): Promise<void> {
  try {
    const els = getElements();

    // Initialize API base URL
    initApiBase();

    // Initialize result with empty state
    els.result.innerHTML = renderResultEmpty();

    // Check authentication status
    await checkAuth(els);

    // Initialize Monaco Editor
    const initialCode = getTemplate('sum_two_numbers', els.language.value as Language);
    initMonacoEditor(els.editorContainer, initialCode, els.language.value as Language);

    // Setup event listeners
    setupEventListeners(els);

    // Load initial data
    await loadProblems(els);
    await refreshLeaderboard(els);
  } catch (error) {
    const resultEl = document.getElementById('result');
    if (resultEl) {
      resultEl.innerHTML = `
        <div class="result-empty">
          <div class="empty-placeholder">ERROR</div>
          <h3>Boot Error</h3>
          <p class="muted">${String(error)}</p>
          <p class="muted">Tip: start backend on ${getApiBase()}</p>
        </div>
      `;
    }
  }
}

// Boot the application
boot();

