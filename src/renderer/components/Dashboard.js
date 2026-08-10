import store from '../store.js';
import API from '../utils/api.js';
import PluginRegistry from '../core/PluginRegistry.js';
import { openProfileModal } from './Modal.js';
import { dateStr, greeting } from '../utils/formatters.js';
import { esc } from '../utils/html.js';

export async function renderDashboard(el) {
  const settings = store.state.settings || {};
  const user = store.state.loggedUser || {};
  const name = settings.nickname || settings.full_name || user.username || 'Usuario';
  const cfg = store.state.appConfig || {};
  let notes = [];
  try { notes = await API.notes.list(user.username ? { username: user.username } : {}); } catch (_) {}

  el.innerHTML = `
    <div class="dash-wrap">
      <div class="dash-topbar">
        <div>
          <div class="dash-topbar-app">${esc(cfg.appName || 'Starcho JS')}</div>
          <div class="dash-topbar-slogan">${esc(cfg.appSlogan || 'Notas simples, rápidas y organizadas')}</div>
        </div>
        <div class="dash-topbar-right">
          <div class="dash-topbar-clock"><div class="dash-topbar-date">${dateStr()}</div></div>
          <button class="dash-hdr-btn" id="dh-profile-btn" title="Editar perfil">👤</button>
          <button class="dash-hdr-btn dash-hdr-btn--primary" id="dh-notes-btn" title="Abrir notas">📝</button>
        </div>
      </div>

      <div class="dash-hero">
        <div class="dash-hero-left">
          <div class="dash-avatar" style="display:grid;place-items:center;font-size:34px">📝</div>
          <div>
            <div class="dash-greeting">${greeting()}, bienvenido de vuelta</div>
            <div class="dash-name">${esc(name)}</div>
            <span class="dash-plan">Tu espacio personal de notas</span>
          </div>
        </div>
        <div class="dash-stats">
          <div class="dash-stat"><span class="dash-stat-num">${notes.length}</span><span class="dash-stat-lbl">📝 Notas</span></div>
          <div class="dash-stat"><span class="dash-stat-num">${notes.filter(n => n.important_date).length}</span><span class="dash-stat-lbl">📅 Con fecha</span></div>
        </div>
      </div>

      <div class="dash-section-title">Acceso rápido</div>
      <div class="dash-quick" style="margin-bottom:24px">
        <button class="dash-quick-btn" id="dash-open-notes"><span class="dqb-icon">📝</span><span class="dqb-label">Mis notas</span></button>
        <button class="dash-quick-btn" id="dash-open-settings"><span class="dqb-icon">⚙️</span><span class="dqb-label">Configuración</span></button>
      </div>

      <div class="dash-section-title">Resumen de notas</div>
      <div class="dash-widgets-grid" id="dash-zone-content"></div>
      <div class="dash-footer"><span>${esc(cfg.appName || 'Starcho JS')} v${esc(cfg.appVersion || '2.0.0')}</span><span>${dateStr()}</span></div>
    </div>`;

  el.querySelector('#dh-profile-btn')?.addEventListener('click', openProfileModal);
  el.querySelector('#dh-notes-btn')?.addEventListener('click', () => store.navigate('notes:list'));
  el.querySelector('#dash-open-notes')?.addEventListener('click', () => store.navigate('notes:list'));
  el.querySelector('#dash-open-settings')?.addEventListener('click', () => store.navigate('settings'));
  await PluginRegistry.renderDashboardZone('content', el.querySelector('#dash-zone-content'));
}
