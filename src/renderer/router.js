import store          from './store.js';
import EventBus        from './utils/eventBus.js';
import PluginRegistry  from './core/PluginRegistry.js';

import { renderDashboard } from './components/Dashboard.js';
import { renderSettings  } from './components/Settings.js';
import { showFatalError } from './utils/fatalScreen.js';

// ── Core views (always available) ────────────────────────────────────────────
const CORE_VIEWS = {
  home:      { el: 'view-dashboard', render: renderDashboard },
  dashboard: { el: 'view-dashboard', render: renderDashboard },
  settings:  { el: 'view-settings',  render: renderSettings  },
};

let _current = null;

async function showView(name, extra = {}) {
  // Hide all views
  document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));

  // Plugin view (contains ':')
  if (name.includes(':')) {
    const slot = document.getElementById('view-plugin');
    if (slot) {
      slot.classList.add('active');
      await PluginRegistry.renderView(name, slot, extra);
    }
    _current = name;
    _updateSidebarActive(name);
    return;
  }

  // Core view
  const def = CORE_VIEWS[name];
  if (!def) {
    // Fallback to dashboard
    await showView('dashboard');
    return;
  }

  const el = document.getElementById(def.el);
  if (el) {
    el.classList.add('active');
    await def.render(el, extra);
  }
  _current = name;
  _updateSidebarActive(name);
}

function _updateSidebarActive(name) {
  document.querySelectorAll('.nav-item').forEach(item =>
    item.classList.toggle('active', item.dataset.view === name)
  );
}

export function initRouter() {
  EventBus.on('navigate', ({ view, ...extra }) => {
    if (!store.state.loggedUser) return; // ignore nav events before login
    void showView(view, extra).catch(showFatalError);
  });

  // Re-render active view on language change
  EventBus.on('lang:change', () => {
    if (!_current) return;
    if (_current.includes(':')) {
      const slot = document.getElementById('view-plugin');
      if (slot) void PluginRegistry.renderView(_current, slot).catch(showFatalError);
      return;
    }
    const def = CORE_VIEWS[_current];
    if (def) {
      const el = document.getElementById(def.el);
      if (el) void def.render(el, {}).catch(showFatalError);
    }
  });

  // Start on home dashboard
  void showView('home').catch(showFatalError);
}

// Used by the login bootstrap to wait until the first real view is rendered
// before the login screen is removed.
export { showView as renderView };
