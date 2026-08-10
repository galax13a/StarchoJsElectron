import store from '../store.js';
import API from '../utils/api.js';
import PluginRegistry from '../core/PluginRegistry.js';
import { openProfileModal } from './Modal.js';
import { dateStr, greeting } from '../utils/formatters.js';
import { esc } from '../utils/html.js';
import { t } from '../utils/i18n.js';

let renderSequence = 0;

export async function renderDashboard(el) {
  const sequence = ++renderSequence;
  const settings = store.state.settings || {};
  const user = store.state.loggedUser || {};
  const name = settings.nickname || settings.full_name || user.username || t('user');
  const cfg = store.state.appConfig || {};

  el.innerHTML = `
    <div class="dash-wrap">
      <div class="dash-topbar">
        <div>
          <div class="dash-topbar-app">${esc(cfg.appName || 'Starcho JS')}</div>
          <div class="dash-topbar-slogan">${esc(cfg.appSlogan || t('app_slogan'))}</div>
        </div>
        <div class="dash-topbar-right">
          <div class="dash-topbar-clock"><div class="dash-topbar-date">${dateStr()}</div></div>
          <button class="dash-hdr-btn" id="dh-profile-btn" title="${t('open_profile')}">👤</button>
          <button class="dash-hdr-btn dash-hdr-btn--primary" id="dh-notes-btn" title="${t('open_notes')}">📝</button>
        </div>
      </div>

      <div class="dash-hero">
        <div class="dash-hero-left">
          <div class="dash-avatar" style="display:grid;place-items:center;font-size:34px">📝</div>
          <div>
            <div class="dash-greeting">${greeting()}, ${t('welcome_back')}</div>
            <div class="dash-name">${esc(name)}</div>
            <span class="dash-plan">${t('personal_notes_space')}</span>
          </div>
        </div>
        <div class="dash-stats">
          <div class="dash-stat"><span class="dash-stat-num" id="dash-notes-total">0</span><span class="dash-stat-lbl">📝 ${t('notes_title')}</span></div>
          <div class="dash-stat"><span class="dash-stat-num" id="dash-notes-dated">0</span><span class="dash-stat-lbl">📅 ${t('notes_with_date')}</span></div>
        </div>
      </div>

      <div class="dash-section-title">${t('quick_access')}</div>
      <div class="dash-quick" style="margin-bottom:24px">
        <button class="dash-quick-btn" id="dash-open-notes"><span class="dqb-icon">📝</span><span class="dqb-label">${t('my_notes')}</span></button>
        <button class="dash-quick-btn" id="dash-open-settings"><span class="dqb-icon">⚙️</span><span class="dqb-label">${t('nav_settings')}</span></button>
      </div>

      <div class="dash-section-title">${t('summary_notes')}</div>
      <div class="dash-widgets-grid" id="dash-zone-content"></div>
      <div class="dash-footer"><span>${esc(cfg.appName || 'Starcho JS')} v${esc(cfg.appVersion || '2.0.0')}</span><span>${dateStr()}</span></div>
    </div>`;

  el.querySelector('#dh-profile-btn')?.addEventListener('click', openProfileModal);
  el.querySelector('#dh-notes-btn')?.addEventListener('click', () => store.navigate('notes:list'));
  el.querySelector('#dash-open-notes')?.addEventListener('click', () => store.navigate('notes:list'));
  el.querySelector('#dash-open-settings')?.addEventListener('click', () => store.navigate('settings'));

  // Paint the dashboard shell before waiting for the API. A slow or expired
  // session must not leave the whole view blank.
  let notes = [];
  try { notes = await API.notes.list(user.username ? { username: user.username } : {}); } catch (_) {}
  // Ignore a slower render started before a newer navigation or profile load.
  if (sequence !== renderSequence) return;
  el.querySelector('#dash-notes-total').textContent = String(notes.length);
  el.querySelector('#dash-notes-dated').textContent = String(notes.filter(n => n.important_date).length);
  await PluginRegistry.renderDashboardZone('content', el.querySelector('#dash-zone-content'));
}
