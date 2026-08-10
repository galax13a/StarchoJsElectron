const LANG_KEY = 'starcho_language';
let currentLang = localStorage.getItem(LANG_KEY) || 'es';

export const LANGUAGES = [
  { code: 'es', flag: '🇪🇸', label: 'Español' },
  { code: 'en', flag: '🇺🇸', label: 'English' },
];

export const THEMES = [
  { id: 'dark', icon: '🌙', labelKey: 'theme_dark', colors: ['#0a0a0a', '#6366f1', '#1f2937'] },
  { id: 'light', icon: '☀️', labelKey: 'theme_light', colors: ['#f8fafc', '#4f46e5', '#e2e8f0'] },
];

const strings = {
  es: {
    nav_home: 'Inicio', nav_notes: 'Notas', nav_settings: 'Ajustes', nav_modules: 'Módulos',
    sidebar_collapse: 'Colapsar', sidebar_expand: 'Expandir', settings_title: 'Configuración',
    profile: 'Perfil', appearance: 'Apariencia', theme: 'Tema', language: 'Idioma', about: 'Acerca de',
    full_name: 'Nombre completo', nickname: 'Apodo', whatsapp: 'WhatsApp', save_profile: 'Guardar perfil',
    user: 'Usuario', your_name: 'Tu nombre', nickname_placeholder: 'Cómo quieres que te llamemos',
    optional: 'Opcional', profile_saved: 'Perfil guardado', theme_dark: 'Oscuro', theme_light: 'Claro',
    about_text: 'Starcho JS es una aplicación local para crear, editar y organizar tus notas.',
  },
  en: {
    nav_home: 'Home', nav_notes: 'Notes', nav_settings: 'Settings', nav_modules: 'Modules',
    sidebar_collapse: 'Collapse', sidebar_expand: 'Expand', settings_title: 'Settings',
    profile: 'Profile', appearance: 'Appearance', theme: 'Theme', language: 'Language', about: 'About',
    full_name: 'Full name', nickname: 'Nickname', whatsapp: 'WhatsApp', save_profile: 'Save profile',
    user: 'User', your_name: 'Your name', nickname_placeholder: 'How should we call you?',
    optional: 'Optional', profile_saved: 'Profile saved', theme_dark: 'Dark', theme_light: 'Light',
    about_text: 'Starcho JS is a local application for creating, editing, and organizing your notes.',
  },
};

export function t(key) { return strings[currentLang]?.[key] || strings.es[key] || key; }
export function getLang() { return currentLang; }
export function setLang(lang) {
  if (!strings[lang]) return;
  currentLang = lang;
  localStorage.setItem(LANG_KEY, lang);
}
