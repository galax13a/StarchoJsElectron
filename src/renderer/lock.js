import API from './utils/api.js';
import store from './store.js';
import { openModal, showToast } from './components/Modal.js';
import { t } from './utils/i18n.js';

let lockOverlay = null;
let unlockMode = 'pin';

function refreshOverlayText() {
  if (!lockOverlay) return;
  const recovering = unlockMode === 'password-recovery';
  lockOverlay.querySelector('h2').textContent = t('lock_title');
  lockOverlay.querySelector('#app-lock-message').textContent = t(recovering ? 'recovery_message' : 'locked_message');
  lockOverlay.querySelector('button[type="submit"]').textContent = t(recovering ? 'recover_access' : 'unlock');
  lockOverlay.querySelector('#app-lock-recover').textContent = t('recover_with_password');
  lockOverlay.querySelector('#app-lock-recover').hidden = unlockMode !== 'pin';
  lockOverlay.querySelector('#app-lock-back').textContent = t('back_to_pin');
  lockOverlay.querySelector('#app-lock-back').hidden = !recovering;
}

function ensureOverlay() {
  if (lockOverlay?.isConnected) return lockOverlay;
  lockOverlay = document.createElement('div');
  lockOverlay.id = 'app-lock-screen';
  lockOverlay.className = 'app-lock-screen';
  lockOverlay.innerHTML = `<div class="app-lock-card">
    <div class="app-lock-icon">🔒</div>
    <h2>${t('lock_title')}</h2>
    <p id="app-lock-message">${t('locked_message')}</p>
    <form id="app-lock-form" autocomplete="off">
      <input id="app-lock-input" class="form-control app-lock-input" type="password" autocomplete="off" inputmode="numeric">
      <button class="btn btn-primary" type="submit">${t('unlock')}</button>
    </form>
    <button type="button" class="btn btn-ghost app-lock-recover" id="app-lock-recover"></button>
    <button type="button" class="btn btn-ghost app-lock-recover" id="app-lock-back"></button>
    <div id="app-lock-error" class="app-lock-error" role="alert"></div>
  </div>`;
  document.body.appendChild(lockOverlay);
  lockOverlay.querySelector('#app-lock-form').addEventListener('submit', (event) => {
    event.preventDefault();
    unlockApp().catch(() => showLockError(t('invalid_lock')));
  });
  lockOverlay.querySelector('#app-lock-recover').addEventListener('click', () => setLocked(true, 'password-recovery'));
  lockOverlay.querySelector('#app-lock-back').addEventListener('click', () => setLocked(true, 'pin'));
  refreshOverlayText();
  return lockOverlay;
}

function showLockError(message) {
  const error = lockOverlay?.querySelector('#app-lock-error');
  if (error) error.textContent = message;
}

async function getConfig() {
  try { return await window.electronAPI?.getLockConfig?.() || { configured: false }; }
  catch (_) { return { configured: false }; }
}

function setLocked(locked, mode = 'pin') {
  const overlay = ensureOverlay();
  unlockMode = mode;
  const input = overlay.querySelector('#app-lock-input');
  input.value = '';
  input.type = mode === 'pin' ? 'password' : 'password';
  input.inputMode = mode === 'pin' ? 'numeric' : 'text';
  input.maxLength = mode === 'pin' ? 4 : 128;
  input.placeholder = mode === 'pin' ? t('enter_pin') : t('enter_password');
  refreshOverlayText();
  overlay.classList.toggle('visible', locked);
  if (locked) setTimeout(() => input.focus(), 50);
}

async function unlockApp() {
  const config = await getConfig();
  const input = lockOverlay.querySelector('#app-lock-input');
  const credential = input.value;
  if (unlockMode === 'password-recovery') {
    const username = store.state.loggedUser?.username;
    if (!username || !credential) { showLockError(t('invalid_lock')); return; }
    try {
      await API.auth.login(username, credential);
      await window.electronAPI.clearLockConfig();
    } catch (_) {
      showLockError(t('invalid_lock'));
      input.select();
      return;
    }
    showLockError('');
    setLocked(false);
    showToast(t('lock_recovered'), 'success');
    return;
  }
  if (config.mode === 'pin') {
    if (!/^\d{4}$/.test(credential)) { showLockError(t('invalid_pin')); return; }
    const valid = await window.electronAPI.verifyLockPin(credential);
    if (!valid) { showLockError(t('invalid_lock')); input.select(); return; }
  } else {
    const username = store.state.loggedUser?.username;
    if (!username || !credential) { showLockError(t('invalid_lock')); return; }
    try { await API.auth.login(username, credential); }
    catch (_) { showLockError(t('invalid_lock')); input.select(); return; }
  }
  showLockError('');
  setLocked(false);
  showToast(t('unlock'), 'success');
}

function lockErrorMessage(error) {
  return error?.message === 'INVALID_PIN' ? t('invalid_pin') : t('invalid_lock');
}

export async function initAppLock() {
  ensureOverlay();
  const config = await getConfig();
  // A configured lock protects every new session, including after a restart.
  // Password recovery remains available from the PIN screen.
  if (config.configured) setLocked(true, config.mode);
}

export async function openAppLock() {
  const config = await getConfig();
  if (!config.configured) return openLockSetup();
  setLocked(true, config.mode);
}

export function openLockSetup() {
  const dialog = openModal({
    title: `🔒 ${t('lock_app')}`,
    content: `<p class="modal-help">${t('lock_setup')}</p>
      <div class="form-group"><label for="lock-method">${t('lock_method')}</label>
        <select class="form-control" id="lock-method"><option value="pin">${t('lock_pin')}</option><option value="password">${t('lock_password')}</option></select>
      </div>
      <div class="form-group" id="lock-pin-group"><label for="lock-pin">${t('create_pin')}</label><input class="form-control" id="lock-pin" type="password" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" autocomplete="new-password"></div>`,
    actions: [
      { label: t('cancel'), class: 'btn-secondary', action: (close) => close() },
      { label: t('save_lock'), class: 'btn-primary', action: async (close, body) => {
        const mode = body.querySelector('#lock-method').value;
        const pin = body.querySelector('#lock-pin').value;
        if (mode === 'pin' && !/^\d{4}$/.test(pin)) { showToast(t('invalid_pin'), 'error'); return; }
        try {
          await window.electronAPI.setLockConfig({ mode, pin });
          close();
          showToast(t('lock_saved'), 'success');
          setLocked(true, mode);
        } catch (error) { showToast(lockErrorMessage(error), 'error'); }
      } },
    ],
  });
  const method = dialog.body.querySelector('#lock-method');
  const pinGroup = dialog.body.querySelector('#lock-pin-group');
  method.addEventListener('change', () => { pinGroup.hidden = method.value !== 'pin'; });
  return dialog;
}
