import { t } from './i18n.js';

let overlay = null;
let retryAction = null;

function escapeText(value) {
  return String(value || '').slice(0, 1600);
}

function ensureOverlay() {
  if (overlay) return overlay;

  overlay = document.createElement('div');
  overlay.id = 'fatal-error-screen';
  overlay.className = 'fatal-error-screen';
  overlay.innerHTML = `
    <section class="fatal-error-card" role="alertdialog" aria-modal="true" aria-labelledby="fatal-error-title">
      <div class="fatal-error-icon" aria-hidden="true">!</div>
      <h1 id="fatal-error-title"></h1>
      <p id="fatal-error-message"></p>
      <details id="fatal-error-details-wrap" class="fatal-error-details-wrap">
        <summary id="fatal-error-details-label"></summary>
        <pre id="fatal-error-details"></pre>
      </details>
      <div class="fatal-error-actions">
        <button type="button" class="btn btn-primary" id="fatal-error-retry"></button>
        <button type="button" class="btn btn-ghost" id="fatal-error-reload"></button>
        <button type="button" class="btn btn-danger" id="fatal-error-exit"></button>
      </div>
    </section>`;

  document.body.appendChild(overlay);
  overlay.querySelector('#fatal-error-retry').addEventListener('click', async () => {
    const action = retryAction;
    hideFatalError();
    if (!action) return window.location.reload();
    try {
      await action();
    } catch (error) {
      showFatalError(error, { retry: action });
    }
  });
  overlay.querySelector('#fatal-error-reload').addEventListener('click', () => window.location.reload());
  overlay.querySelector('#fatal-error-exit').addEventListener('click', () => {
    if (window.electronAPI?.close) window.electronAPI.close();
    else window.close();
  });
  return overlay;
}

export function showFatalError(error, { retry = null } = {}) {
  const root = ensureOverlay();
  retryAction = retry;
  root.querySelector('#fatal-error-title').textContent = t('fatal_title');
  root.querySelector('#fatal-error-message').textContent = t('fatal_message');
  root.querySelector('#fatal-error-details-label').textContent = t('fatal_details');
  root.querySelector('#fatal-error-details').textContent = escapeText(error?.stack || error?.message || error);
  root.querySelector('#fatal-error-retry').textContent = t('retry');
  root.querySelector('#fatal-error-reload').textContent = t('reload_app');
  root.querySelector('#fatal-error-exit').textContent = t('exit_app');
  root.querySelector('#fatal-error-retry').hidden = !retry;
  root.classList.add('visible');
}

export function hideFatalError() {
  overlay?.classList.remove('visible');
}
