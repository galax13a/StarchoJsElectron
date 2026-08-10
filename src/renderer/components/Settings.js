import store from '../store.js';
import API from '../utils/api.js';
import { t, LANGUAGES, THEMES, getLang } from '../utils/i18n.js';
import { showToast } from './Modal.js';
import { esc } from '../utils/html.js';

export async function renderSettings(el) {
  const settings = store.state.settings || {};
  const user = store.state.loggedUser || {};
  el.innerHTML = `
    <div class="settings-scroll" style="padding:24px">
      <div class="topbar"><span class="topbar-title">${t('settings_title')}</span></div>
      <section class="settings-section" id="sec-profile">
        <div class="settings-section-title">👤 ${t('profile')}</div>
        <div class="profile-card"><div class="profile-fields" style="width:100%">
          <div class="form-group"><label>${t('user')}</label><input class="form-control" value="${esc(user.username || '')}" readonly></div>
          <div class="form-group"><label>${t('full_name')}</label><input class="form-control" id="p-fullname" value="${esc(settings.full_name || '')}" placeholder="${t('your_name')}"></div>
          <div class="form-group"><label>${t('nickname')}</label><input class="form-control" id="p-nickname" value="${esc(settings.nickname || '')}" placeholder="${t('nickname_placeholder')}"></div>
          <div class="form-group"><label>${t('whatsapp')}</label><input class="form-control" id="p-whatsapp" value="${esc(settings.whatsapp || '')}" placeholder="${t('optional')}"></div>
          <button class="btn btn-primary btn-sm" id="btn-save-profile">${t('save_profile')}</button>
        </div></div>
      </section>

      <section class="settings-section"><div class="settings-section-title">🎨 ${t('appearance')}</div>
        <div class="appearance-group"><div class="appearance-group-label">${t('theme')}</div>
          <div class="theme-grid">${THEMES.map(theme => `<button class="theme-card2 ${store.state.theme === theme.id ? 'active' : ''}" data-theme="${theme.id}"><div class="tc2-preview" style="background:${theme.colors[0]}"><span class="tc2-accent" style="background:${theme.colors[1]}"></span><span class="tc2-accent tc2-accent2" style="background:${theme.colors[2]}"></span></div><div class="tc2-label">${theme.icon} ${t(theme.labelKey)}</div></button>`).join('')}</div>
        </div>
        <div class="appearance-group" style="margin-top:20px"><div class="appearance-group-label">${t('language')}</div>
          <div class="lang-selector">${LANGUAGES.map(lang => `<button class="lang-card ${getLang() === lang.code ? 'active' : ''}" data-lang="${lang.code}"><span class="lang-flag">${lang.flag}</span><span class="lang-name">${lang.label}</span></button>`).join('')}</div>
        </div>
      </section>

      <section class="settings-section"><div class="settings-section-title">ℹ️ ${t('about')}</div><p style="color:var(--text-secondary);line-height:1.7">Starcho JS ${store.state.appConfig.appVersion || '2.0.0'} es una aplicación local para crear, editar y organizar tus notas.</p></section>
    </div>`;

  el.querySelector('#btn-save-profile')?.addEventListener('click', async () => {
    if (!user.username) return;
    const data = {
      username: user.username,
      full_name: el.querySelector('#p-fullname').value.trim(),
      nickname: el.querySelector('#p-nickname').value.trim(),
      whatsapp: el.querySelector('#p-whatsapp').value.trim(),
      avatar: settings.avatar || '',
    };
    try {
      await API.auth.updateProfile(data);
      store.setState({ settings: { ...store.state.settings, ...data } });
      showToast(t('profile_saved'), 'success');
    } catch (error) { showToast(error.message, 'error'); }
  });
  el.querySelectorAll('[data-theme]').forEach((button) => button.addEventListener('click', () => store.applyTheme(button.dataset.theme)));
  el.querySelectorAll('[data-lang]').forEach((button) => button.addEventListener('click', () => store.setLanguage(button.dataset.lang)));
}
