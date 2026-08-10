import store from '../store.js';
import API from '../utils/api.js';
import { t, LANGUAGES, THEMES, getLang } from '../utils/i18n.js';
import { showToast } from './Modal.js';
import { esc } from '../utils/html.js';

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='48' fill='%23343b4a'/%3E%3Ccircle cx='48' cy='38' r='18' fill='%239ca3af'/%3E%3Cellipse cx='48' cy='88' rx='30' ry='22' fill='%239ca3af'/%3E%3C/svg%3E";
const LOGIN_THEMES = [
  ['nebula', '🌌', 'Nebula'], ['split', '🪟', 'Split'], ['glass', '✨', 'Glass'], ['kick', '🟢', 'Kick'],
  ['arcade', '🕹️', 'Arcade'], ['galax', '🌠', 'Galax'], ['cyber', '⚡', 'Cyber'], ['lux', '💎', 'Lux'],
];
const TITLEBAR_THEMES = [
  ['default', '🪟', 'Windows'], ['mac', '🍎', 'macOS'], ['linux', '🐧', 'Linux'],
  ['cartoon', '🕹️', 'Gamer'], ['stripe', '💳', 'Stripe'],
];

function settingValue(settings, key, fallback = '') {
  return settings?.[key] === null || settings?.[key] === undefined ? fallback : settings[key];
}

function applyTitlebar(theme) {
  const bar = document.getElementById('title-bar');
  const valid = TITLEBAR_THEMES.map(([id]) => id);
  if (bar) bar.dataset.titlebar = valid.includes(theme) ? theme : 'default';
}

function updateAvatar(img, value) {
  if (img) img.src = value || DEFAULT_AVATAR;
}

export async function renderSettings(el) {
  const baseSettings = store.state.settings || {};
  const user = store.state.loggedUser || {};
  let profile = {};
  try {
    if (user.username) profile = await API.auth.getProfile(user.username);
  } catch (_) { /* The form remains usable with the cached session data. */ }
  const settings = { ...baseSettings, ...profile };
  store.setState({ settings });

  const activeTheme = THEMES.some((theme) => theme.id === store.state.theme) ? store.state.theme : 'dark';
  const activeLang = getLang();
  const activeLoginTheme = settingValue(settings, 'login_theme', 'nebula');
  const activeTitlebar = settingValue(settings, 'titlebar_theme', 'default');

  el.innerHTML = `
    <div class="settings-page settings-scroll">
      <div class="settings-hero">
        <div>
          <div class="topbar-title">${t('settings_title')}</div>
          <p class="settings-subtitle">${t('settings_subtitle')}</p>
        </div>
        <span class="settings-status">✓ ${t('settings_loaded')}</span>
      </div>

      <section class="settings-section tab-active" id="sec-profile">
        <div class="settings-section-title">👤 ${t('profile')}</div>
        <p class="settings-description">${t('profile_description')}</p>
        <div class="profile-card">
          <div class="profile-avatar-column">
            <div class="profile-avatar-wrap">
              <img id="avatar-img" class="profile-avatar" src="${esc(settingValue(settings, 'avatar') || DEFAULT_AVATAR)}" alt="${t('avatar')}">
              <button type="button" class="avatar-change-btn" id="btn-avatar-trigger" title="${t('change_avatar')}">📷</button>
            </div>
            <input type="file" id="avatar-input" accept="image/png,image/jpeg,image/gif,image/webp" hidden>
            <button type="button" class="btn btn-ghost btn-sm" id="btn-avatar-remove">${t('remove_avatar')}</button>
            <small class="avatar-hint">${t('avatar_hint')}</small>
          </div>
          <div class="profile-fields">
            <div class="form-group">
              <label for="p-username">${t('user')}</label>
              <input class="form-control" id="p-username" value="${esc(user.username || '')}" readonly>
            </div>
            <div class="profile-fields-grid">
              <div class="form-group"><label for="p-fullname">${t('full_name')}</label><input class="form-control" id="p-fullname" value="${esc(settingValue(settings, 'full_name'))}" placeholder="${t('your_name')}"></div>
              <div class="form-group"><label for="p-nickname">${t('nickname')}</label><input class="form-control" id="p-nickname" value="${esc(settingValue(settings, 'nickname'))}" placeholder="${t('nickname_placeholder')}"></div>
            </div>
            <div class="form-group"><label for="p-whatsapp">${t('whatsapp')} <span class="form-label-hint">(${t('optional')})</span></label><input class="form-control" id="p-whatsapp" value="${esc(settingValue(settings, 'whatsapp'))}" placeholder="+57 300 000 0000" maxlength="30"></div>
            <div class="settings-actions"><button class="btn btn-primary" id="btn-save-profile">${t('save_changes')}</button></div>
          </div>
        </div>
      </section>

      <section class="settings-section tab-active" id="sec-appearance">
        <div class="settings-section-title">🎨 ${t('appearance')}</div>
        <div class="appearance-group">
          <div class="appearance-group-label">${t('skin')}</div>
          <p class="settings-description">${t('skin_description')}</p>
          <div class="theme-grid" id="theme-cards">
            ${THEMES.map((theme) => `<button type="button" class="theme-card2 ${activeTheme === theme.id ? 'active' : ''}" data-theme="${theme.id}" aria-pressed="${activeTheme === theme.id}"><div class="tc2-preview" style="background:${theme.colors[0]}"><span class="tc2-accent" style="background:${theme.colors[1]}"></span><span class="tc2-accent tc2-accent2" style="background:${theme.colors[2]}"></span>${activeTheme === theme.id ? '<span class="tc2-check">✓</span>' : ''}</div><div class="tc2-label">${theme.icon} ${t(theme.labelKey)}</div></button>`).join('')}
          </div>
        </div>
        <div class="appearance-group settings-appearance-block">
          <div class="appearance-group-label">${t('language')}</div>
          <p class="settings-description">${t('language_description')}</p>
          <div class="lang-selector" id="lang-cards">
            ${LANGUAGES.map((lang) => `<button type="button" class="lang-card ${activeLang === lang.code ? 'active' : ''}" data-lang="${lang.code}" aria-pressed="${activeLang === lang.code}"><span class="lang-flag">${lang.flag}</span><span class="lang-name">${lang.label}</span>${activeLang === lang.code ? '<span class="lang-check">✓</span>' : ''}</button>`).join('')}
          </div>
        </div>
      </section>

      <section class="settings-section tab-active" id="sec-login-skin">
        <div class="settings-section-title">🔐 ${t('login_theme')}</div>
        <p class="settings-description">${t('login_theme_description')} ${t('applied_next_login')}</p>
        <div class="ltheme-grid" id="login-theme-cards">
          ${LOGIN_THEMES.map(([id, icon, label]) => `<button type="button" class="ltheme-card ${activeLoginTheme === id ? 'active' : ''}" data-login-theme="${id}"><div class="ltheme-preview ltheme-preview--${id}"><span class="ltp-blob-a"></span><span class="ltp-blob-b"></span><span class="ltp-card-mock"></span></div><span class="ltheme-label">${icon} ${label}</span></button>`).join('')}
        </div>
      </section>

      <section class="settings-section tab-active" id="sec-titlebar">
        <div class="settings-section-title">🖥️ ${t('titlebar_theme')}</div>
        <p class="settings-description">${t('titlebar_theme_description')}</p>
        <div class="tb-theme-grid" id="titlebar-theme-cards">
          ${TITLEBAR_THEMES.map(([id, icon, label]) => `<button type="button" class="tb-theme-card ${activeTitlebar === id ? 'active' : ''}" data-titlebar-theme="${id}"><span class="tb-theme-icon">${icon}</span><span class="tb-theme-label">${label}</span></button>`).join('')}
        </div>
      </section>

      <section class="settings-section tab-active" id="sec-about">
        <div class="settings-section-title">ℹ️ ${t('system_info')}</div>
        <p class="settings-about-text">${t('about_text')}</p>
        <div class="settings-info-row"><span>${t('about')}</span><strong>Starcho JS ${esc(store.state.appConfig.appVersion || '2.0.0')}</strong></div>
        <div class="settings-info-row"><span>${t('local_data')}</span><span>${t('local_data_description')}</span></div>
      </section>

      <section class="settings-section tab-active" id="sec-data">
        <div class="settings-section-title">💾 ${t('data_management')}</div>
        <p class="settings-description">${t('backup_description')}</p>
        <button type="button" class="btn btn-secondary" id="btn-create-backup">💾 ${t('backup_data')}</button>
      </section>
    </div>`;

  let avatarValue = settingValue(settings, 'avatar') || '';
  const avatarImg = el.querySelector('#avatar-img');
  const avatarInput = el.querySelector('#avatar-input');
  el.querySelector('#btn-avatar-trigger')?.addEventListener('click', () => avatarInput?.click());
  el.querySelector('#btn-avatar-remove')?.addEventListener('click', () => {
    avatarValue = '';
    updateAvatar(avatarImg, '');
  });
  avatarInput?.addEventListener('change', () => {
    const file = avatarInput.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast(t('avatar_invalid'), 'error'); avatarInput.value = ''; return; }
    if (file.size > 350 * 1024) { showToast(t('avatar_too_large'), 'error'); avatarInput.value = ''; return; }
    const reader = new FileReader();
    reader.onload = () => { avatarValue = String(reader.result || ''); updateAvatar(avatarImg, avatarValue); };
    reader.readAsDataURL(file);
  });

  el.querySelector('#btn-save-profile')?.addEventListener('click', async () => {
    if (!user.username) return;
    const button = el.querySelector('#btn-save-profile');
    button.disabled = true;
    button.textContent = t('saving');
    const data = {
      username: user.username,
      full_name: el.querySelector('#p-fullname').value.trim(),
      nickname: el.querySelector('#p-nickname').value.trim(),
      whatsapp: el.querySelector('#p-whatsapp').value.trim(),
      avatar: avatarValue || null,
    };
    try {
      const saved = await API.auth.updateProfile(data);
      store.setState({ settings: { ...store.state.settings, ...data, ...saved } });
      showToast(t('profile_saved'), 'success');
      button.textContent = t('saved');
      setTimeout(() => { if (button.isConnected) { button.disabled = false; button.textContent = t('save_changes'); } }, 900);
    } catch (error) {
      button.disabled = false;
      button.textContent = t('save_changes');
      showToast(error.message || t('account_error'), 'error');
    }
  });

  el.querySelectorAll('[data-theme]').forEach((button) => button.addEventListener('click', () => {
    store.applyTheme(button.dataset.theme);
    el.querySelectorAll('[data-theme]').forEach((item) => { const active = item === button; item.classList.toggle('active', active); item.setAttribute('aria-pressed', String(active)); });
  }));
  el.querySelectorAll('[data-lang]').forEach((button) => button.addEventListener('click', () => store.setLanguage(button.dataset.lang)));
  el.querySelectorAll('[data-login-theme]').forEach((button) => button.addEventListener('click', async () => {
    const selected = button.dataset.loginTheme;
    try {
      await API.settings.setMany({ login_theme: selected });
      localStorage.setItem('starcho_login_theme', selected);
      store.setState({ settings: { ...store.state.settings, login_theme: selected } });
      document.getElementById('login-page')?.setAttribute('data-ltheme', selected);
      el.querySelectorAll('[data-login-theme]').forEach((item) => item.classList.toggle('active', item === button));
      showToast(t('saved'), 'success');
    } catch (error) { showToast(error.message, 'error'); }
  }));
  el.querySelectorAll('[data-titlebar-theme]').forEach((button) => button.addEventListener('click', async () => {
    const selected = button.dataset.titlebarTheme;
    applyTitlebar(selected);
    try {
      await API.settings.setMany({ titlebar_theme: selected });
      store.setState({ settings: { ...store.state.settings, titlebar_theme: selected } });
      el.querySelectorAll('[data-titlebar-theme]').forEach((item) => item.classList.toggle('active', item === button));
      showToast(t('saved'), 'success');
    } catch (error) { showToast(error.message, 'error'); }
  }));
  el.querySelector('#btn-create-backup')?.addEventListener('click', async () => {
    const button = el.querySelector('#btn-create-backup');
    if (!window.electronAPI?.createBackup) { showToast(t('backup_unavailable'), 'error'); return; }
    button.disabled = true;
    try {
      const result = await window.electronAPI.createBackup();
      if (!result?.canceled) showToast(`${t('backup_success')}: ${result.path}`, 'success');
    } catch (error) { showToast(error.message || t('backup_unavailable'), 'error'); }
    finally { button.disabled = false; }
  });
}
