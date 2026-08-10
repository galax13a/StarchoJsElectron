/** Starcho JS renderer bootstrap. */
import API from './utils/api.js';
import store from './store.js';
import PluginRegistry from './core/PluginRegistry.js';
import { initErrorHandler, logError } from './utils/errorHandler.js';
import { initRouter, renderView } from './router.js';
import { initSidebar } from './components/Sidebar.js';
import { initModal, showToast } from './components/Modal.js';
import { initAppLock } from './lock.js';
import { t } from './utils/i18n.js';
import { showFatalError } from './utils/fatalScreen.js';

let booted = false;
let bootPromise = null;
let errorHandlerReady = false;

async function boot() {
  if (booted) return;
  if (bootPromise) return bootPromise;
  bootPromise = (async () => {
    if (!errorHandlerReady) {
      initErrorHandler((error) => showFatalError(error));
      errorHandlerReady = true;
    }

    if (window.electronAPI) {
      const port = await window.electronAPI.getServerPort();
      API.setBase(`http://127.0.0.1:${port}`);
    }

    await Promise.all([store.loadSettings(), store.loadConfig()]);
    const cfg = store.state.appConfig;
    const title = document.getElementById('tb-title');
    if (title) title.textContent = `${cfg.appName || 'Starcho JS'} v${cfg.appVersion || '2.0.0'}`;

    // Notes is the only application module enabled in this distribution.
    await PluginRegistry.init();

    wireWindowControls();
    initModal();
    await initAppLock();
    initSidebar(document.getElementById('sidebar'));
    initRouter();
    applyTitlebarTheme(store.state.settings?.titlebar_theme);
    wireKeyboard();

    booted = true;
    console.log('Starcho JS v2.0.0 ready');
  })();

  try {
    await bootPromise;
  } catch (error) {
    booted = false;
    bootPromise = null;
    throw error;
  }
}

function wireWindowControls() {
  document.getElementById('btn-minimize')?.addEventListener('click', () => window.electronAPI?.minimize());
  document.getElementById('btn-maximize')?.addEventListener('click', () => window.electronAPI?.maximize());
  document.getElementById('btn-close')?.addEventListener('click', () => window.electronAPI?.close());

  const hamburger = document.getElementById('btn-hamburger');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (!hamburger || !sidebar || !overlay) return;
  const close = () => { sidebar.classList.remove('mobile-open'); overlay.classList.remove('visible'); };
  hamburger.addEventListener('click', () => {
    sidebar.classList.toggle('mobile-open');
    overlay.classList.toggle('visible');
  });
  overlay.addEventListener('click', close);
  sidebar.addEventListener('click', (e) => {
    if (e.target.closest('.nav-item') && window.innerWidth <= 600) close();
  });
}

function applyTitlebarTheme(theme) {
  const bar = document.getElementById('title-bar');
  if (!bar) return;
  const valid = ['mac', 'linux', 'cartoon', 'stripe'];
  bar.dataset.titlebar = valid.includes(theme) ? theme : 'default';
}

function wireKeyboard() {
  document.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyF') {
      e.preventDefault();
      store.navigate('notes:list');
    }
  });
}

function dispatchLoginEvent(name, detail) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

window.addEventListener('user:login', async (e) => {
  store.setState({ loggedUser: e.detail });
  try {
    await boot();
    await store.loadUserProfile();
    const lastView = (() => { try { return localStorage.getItem('last_view'); } catch (_) { return null; } })();
    const destination = lastView === 'notes:list' ? lastView : 'home';
    store.setState({ currentView: destination });
    try { localStorage.setItem('last_view', destination); } catch (_) {}
    await renderView(destination);
    dispatchLoginEvent('user:login:ready', e.detail);
  } catch (err) {
    logError(err);
    console.error('Starcho JS login bootstrap failed:', err);
    showToast(t('app_start_error'), 'error');
    dispatchLoginEvent('user:login:error', err);
    showFatalError(err, {
      retry: async () => {
        await boot();
        await store.loadUserProfile();
        store.setState({ currentView: 'home' });
        await renderView('home');
        dispatchLoginEvent('user:login:ready', e.detail);
      },
    });
  }
});
