import EventBus from './utils/eventBus.js';
import API from './utils/api.js';
import { setLang, THEMES } from './utils/i18n.js';

const THEME_IDS = new Set(THEMES.map((theme) => theme.id));

const store = {
  state: {
    theme: 'dark',
    currentView: 'home',
    settings: {},
    appConfig: {
      appName: 'Starcho JS', appSlogan: 'Notas simples, rápidas y organizadas',
      appVersion: '2.0.0', logoText: 'Notas', appTitle: 'Starcho JS — Notas',
    },
    loggedUser: null,
  },

  setState(updates) {
    const previous = this.state;
    this.state = { ...this.state, ...updates };
    Object.keys(updates).forEach((key) => {
      if (previous[key] !== updates[key]) EventBus.emit(`store:${key}`, updates[key]);
    });
    EventBus.emit('store:change', this.state);
  },

  async loadConfig() {
    try { this.setState({ appConfig: await API.config.get() }); } catch (_) {}
  },

  async loadSettings() {
    const settings = await API.settings.getAll();
    this.setState({ settings });
    const savedTheme = localStorage.getItem('starcho_theme');
    const savedLanguage = localStorage.getItem('starcho_language');
    const theme = THEME_IDS.has(savedTheme) ? savedTheme : (THEME_IDS.has(settings.theme) ? settings.theme : 'dark');
    const language = savedLanguage === 'en' || savedLanguage === 'es' ? savedLanguage : settings.language;
    this.applyTheme(theme, false);
    if (language) setLang(language);
    return settings;
  },

  async loadUserProfile() {
    const username = this.state.loggedUser?.username;
    if (!username) return;
    try { this.setState({ settings: { ...this.state.settings, ...await API.auth.getProfile(username) } }); } catch (_) {}
  },

  setLanguage(language) {
    setLang(language);
    this.setState({ settings: { ...this.state.settings, language } });
    API.settings.setMany({ language }).catch(() => {});
    EventBus.emit('lang:change', language);
  },

  applyTheme(theme, persist = true) {
    const selected = THEME_IDS.has(theme) ? theme : 'dark';
    document.documentElement.setAttribute('data-theme', selected);
    localStorage.setItem('starcho_theme', selected);
    this.setState({ theme: selected });
    if (persist) API.settings.setMany({ theme: selected }).catch(() => {});
  },

  navigate(view) {
    this.setState({ currentView: view });
    EventBus.emit('navigate', { view });
    try { localStorage.setItem('last_view', view); } catch (_) {}
  },
};

export default store;
