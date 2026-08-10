'use strict';

/**
 * dialog.js — Custom Promise-based confirm/alert dialogs.
 *
 * API intentionally mirrors Notiflix's Confirm module so it can be swapped
 * for the real library in the future without touching callers.
 *
 * Usage:
 *   import { confirmDialog, alertDialog } from '../utils/dialog.js';
 *
 *   const ok = await confirmDialog('Eliminar', '¿Estás seguro?', { danger: true });
 *   if (!ok) return;
 */

// ── Internal helpers ──────────────────────────────────────────────────────────

function _make(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html.trim();
  return tmp.firstElementChild;
}

function _show(overlay) {
  document.body.appendChild(overlay);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => overlay.classList.add('dlg-in'));
  });
}

function _hide(overlay, resolve, value) {
  overlay.classList.remove('dlg-in');
  setTimeout(() => { try { overlay.remove(); } catch (_) {} resolve(value); }, 220);
}

function _escHandler(overlay, resolve, value) {
  function onKey(e) {
    if (e.key === 'Escape') {
      document.removeEventListener('keydown', onKey);
      _hide(overlay, resolve, value);
    }
  }
  document.addEventListener('keydown', onKey);
  return onKey;
}

// ── confirmDialog ─────────────────────────────────────────────────────────────

/**
 * Show a centered confirmation dialog.
 * Returns a Promise<boolean> — true if the user clicked the confirm button.
 *
 * @param {string} title
 * @param {string} [message]
 * @param {object} [opts]
 * @param {boolean} [opts.danger=false]   — red confirm button + red icon ring
 * @param {string}  [opts.confirmText]
 * @param {string}  [opts.cancelText]
 * @param {string}  [opts.icon]           — emoji shown in the icon circle
 */
export function confirmDialog(title, message = '', {
  danger      = false,
  confirmText = 'Confirmar',
  cancelText  = 'Cancelar',
  icon        = danger ? '🗑️' : '⚠️',
} = {}) {
  return new Promise(resolve => {
    const overlay = _make(`
      <div class="dlg-overlay" role="dialog" aria-modal="true" aria-label="${title}">
        <div class="dlg-box">
          <div class="dlg-icon-wrap ${danger ? 'dlg-icon-danger' : 'dlg-icon-warn'}">${icon}</div>
          <div class="dlg-title">${title}</div>
          ${message ? `<p class="dlg-msg">${message}</p>` : ''}
          <div class="dlg-actions">
            <button class="btn btn-secondary dlg-btn-cancel">${cancelText}</button>
            <button class="btn ${danger ? 'btn-danger' : 'btn-primary'} dlg-btn-ok">${confirmText}</button>
          </div>
        </div>
      </div>`);

    const close = v => { escH && document.removeEventListener('keydown', escH); _hide(overlay, resolve, v); };
    const escH  = _escHandler(overlay, resolve, false);

    overlay.querySelector('.dlg-btn-ok').addEventListener('click', () => close(true));
    overlay.querySelector('.dlg-btn-cancel').addEventListener('click', () => close(false));
    overlay.addEventListener('click', e => { if (e.target === overlay) close(false); });

    _show(overlay);
    setTimeout(() => overlay.querySelector('.dlg-btn-ok')?.focus(), 60);
  });
}

// ── alertDialog ───────────────────────────────────────────────────────────────

/**
 * Show a simple alert dialog (single OK button).
 * Returns Promise<void>.
 *
 * @param {string} title
 * @param {string} [message]
 * @param {object} [opts]
 * @param {string} [opts.type]        — 'info'|'success'|'error'|'warn'
 * @param {string} [opts.confirmText]
 * @param {string} [opts.icon]
 */
export function alertDialog(title, message = '', {
  type        = 'info',
  confirmText = 'Aceptar',
  icon,
} = {}) {
  const ICONS = { info: 'ℹ️', success: '✅', error: '❌', warn: '⚠️' };
  const emoji = icon ?? ICONS[type] ?? 'ℹ️';

  return new Promise(resolve => {
    const overlay = _make(`
      <div class="dlg-overlay" role="alertdialog" aria-modal="true" aria-label="${title}">
        <div class="dlg-box">
          <div class="dlg-icon-wrap dlg-icon-${type}">${emoji}</div>
          <div class="dlg-title">${title}</div>
          ${message ? `<p class="dlg-msg">${message}</p>` : ''}
          <div class="dlg-actions dlg-actions-center">
            <button class="btn btn-primary dlg-btn-ok">${confirmText}</button>
          </div>
        </div>
      </div>`);

    const close = () => { escH && document.removeEventListener('keydown', escH); _hide(overlay, resolve, undefined); };
    const escH  = _escHandler(overlay, resolve, undefined);

    overlay.querySelector('.dlg-btn-ok').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function enter(e) {
      if (e.key === 'Enter') { document.removeEventListener('keydown', enter); close(); }
    });

    _show(overlay);
    setTimeout(() => overlay.querySelector('.dlg-btn-ok')?.focus(), 60);
  });
}
