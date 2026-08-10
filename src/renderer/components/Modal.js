import API from '../utils/api.js';
import store from '../store.js';
import { t } from '../utils/i18n.js';

export function markFieldErrors(fields, container) {
  if (!fields || !container) return;
  Object.entries(fields).forEach(([name, messages]) => {
    const field = container.querySelector(`[data-field="${name}"]`) || container.querySelector(`#${name}`);
    if (!field) return;
    field.classList.add('is-invalid');
    const error = document.createElement('div');
    error.className = 'field-error-msg';
    error.textContent = Array.isArray(messages) ? messages[0] : String(messages);
    field.insertAdjacentElement('afterend', error);
  });
}

export function clearFieldErrors(container) {
  container?.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
  container?.querySelectorAll('.field-error-msg').forEach((el) => el.remove());
}

let container;

export function initModal() {
  container = document.getElementById('modal-container');
}

export function showToast(message, type = 'info') {
  const host = document.getElementById('toast-container');
  if (!host) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = `${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'} ${message}`;
  host.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

export function openModal({ title, content, actions = [] }) {
  if (!container) initModal();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal anim-scale-in">
    <div class="modal-header"><h3 class="modal-title">${title}</h3><button class="modal-close" type="button">✕</button></div>
    <div class="modal-body">${content}</div>
    ${actions.length ? `<div class="modal-footer" style="display:flex;gap:10px;justify-content:flex-end;margin-top:24px">${actions.map((action, index) => `<button class="btn ${action.class || 'btn-secondary'}" type="button" data-modal-action="${index}">${action.label}</button>`).join('')}</div>` : ''}
  </div>`;
  container.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('open'));
  const close = () => { overlay.classList.remove('open'); setTimeout(() => overlay.remove(), 250); };
  overlay.querySelector('.modal-close').addEventListener('click', close);
  overlay.addEventListener('click', (event) => { if (event.target === overlay) close(); });
  actions.forEach((action, index) => overlay.querySelector(`[data-modal-action="${index}"]`)?.addEventListener('click', () => action.action?.(close, overlay.querySelector('.modal-body'))));
  return { close, overlay, body: overlay.querySelector('.modal-body') };
}

export function openProfileModal() {
  const settings = store.state.settings || {};
  const username = store.state.loggedUser?.username;
  openModal({
    title: `👤 ${t('edit_profile')}`,
    content: `<div class="form-group"><label>${t('full_name')}</label><input class="form-control" id="profile-name" data-field="full_name" value="${safe(settings.full_name)}"></div>
      <div class="form-group"><label>${t('nickname')}</label><input class="form-control" id="profile-nickname" data-field="nickname" value="${safe(settings.nickname)}"></div>
      <div class="form-group"><label>${t('whatsapp')}</label><input class="form-control" id="profile-whatsapp" data-field="whatsapp" value="${safe(settings.whatsapp)}"></div>`,
    actions: [
      { label: t('cancel'), class: 'btn-secondary', action: (close) => close() },
      { label: t('save'), class: 'btn-primary', action: async (close, body) => {
        const data = {
          username,
          full_name: body.querySelector('#profile-name').value.trim(),
          nickname: body.querySelector('#profile-nickname').value.trim(),
          whatsapp: body.querySelector('#profile-whatsapp').value.trim(),
          avatar: settings.avatar || '',
        };
        try {
          await API.auth.updateProfile(data);
          store.setState({ settings: { ...store.state.settings, ...data } });
          close();
          showToast(t('profile_saved'), 'success');
        } catch (_) { showToast(t('profile_save_error'), 'error'); }
      } },
    ],
  });
}

function safe(value) {
  return String(value || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
