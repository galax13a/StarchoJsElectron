const LANG_KEY = 'starcho_language';
let currentLang = localStorage.getItem(LANG_KEY) || 'es';

export const LANGUAGES = [
  { code: 'es', flag: '🇪🇸', label: 'Español' },
  { code: 'en', flag: '🇺🇸', label: 'English' },
];

export const THEMES = [
  { id: 'dark', icon: '🌙', labelKey: 'theme_dark', colors: ['#0a0a0a', '#6366f1', '#1f2937'] },
  { id: 'light', icon: '☀️', labelKey: 'theme_light', colors: ['#f8fafc', '#4f46e5', '#e2e8f0'] },
  { id: 'ocean', icon: '🌊', labelKey: 'theme_ocean', colors: ['#06283d', '#00a8cc', '#1363df'] },
  { id: 'neon', icon: '💜', labelKey: 'theme_neon', colors: ['#10002b', '#c77dff', '#7b2cbf'] },
  { id: 'pink', icon: '🌸', labelKey: 'theme_pink', colors: ['#2b0b18', '#ff4d8d', '#ff8fab'] },
  { id: 'red', icon: '🔥', labelKey: 'theme_red', colors: ['#1a0709', '#ff334f', '#9b1c31'] },
  { id: 'matrix', icon: '⌨️', labelKey: 'theme_matrix', colors: ['#000000', '#00ff41', '#0a1a0a'] },
  { id: 'arcade', icon: '🕹️', labelKey: 'theme_arcade', colors: ['#16052b', '#ff00cc', '#00e5ff'] },
  { id: 'military', icon: '🪖', labelKey: 'theme_military', colors: ['#172015', '#9aaa3b', '#3c5425'] },
  { id: 'kick', icon: '🟢', labelKey: 'theme_kick', colors: ['#071b16', '#53fc18', '#20c997'] },
  { id: 'winamp', icon: '🎵', labelKey: 'theme_winamp', colors: ['#1c1c1c', '#00b4d8', '#0077b6'] },
  { id: 'rickmorty', icon: '🛸', labelKey: 'theme_rickmorty', colors: ['#082b2b', '#00d084', '#f6d743'] },
];

const strings = {
  es: {
    nav_home: 'Inicio', nav_notes: 'Notas', nav_settings: 'Ajustes', nav_modules: 'Módulos',
    sidebar_collapse: 'Colapsar', sidebar_expand: 'Expandir', settings_title: 'Configuración',
    profile: 'Perfil', appearance: 'Apariencia', theme: 'Tema', language: 'Idioma', about: 'Acerca de',
    full_name: 'Nombre completo', nickname: 'Apodo', whatsapp: 'WhatsApp', save_profile: 'Guardar perfil',
    user: 'Usuario', your_name: 'Tu nombre', nickname_placeholder: 'Cómo quieres que te llamemos',
    optional: 'Opcional', profile_saved: 'Perfil guardado', theme_dark: 'Oscuro', theme_light: 'Claro',
    theme_ocean: 'Océano', theme_neon: 'Neón', theme_pink: 'Rosa', theme_red: 'Rojo',
    theme_matrix: 'Matrix', theme_arcade: 'Arcade', theme_military: 'Militar', theme_kick: 'Kick',
    theme_winamp: 'Winamp', theme_rickmorty: 'Rick & Morty',
    settings_subtitle: 'Personaliza tu perfil, apariencia y preferencias de Starcho JS.',
    profile_description: 'Estos datos aparecen en tu perfil y en la barra lateral.', avatar: 'Avatar',
    change_avatar: 'Cambiar avatar', remove_avatar: 'Quitar avatar', avatar_hint: 'PNG, JPG, GIF o WEBP. Máximo 350 KB.',
    choose_image: 'Elegir imagen', avatar_invalid: 'Selecciona una imagen válida.', avatar_too_large: 'La imagen debe pesar 350 KB o menos.',
    save_changes: 'Guardar cambios', saving: 'Guardando…', saved: 'Guardado',
    skin: 'Skin de la aplicación', skin_description: 'Elige los colores y estilo visual de toda la aplicación.',
    language_description: 'Cambia el idioma de la interfaz. Se guarda para el próximo inicio.',
    login_theme: 'Skin de la pantalla de acceso', login_theme_description: 'Personaliza la pantalla que aparece antes de entrar a tus notas.',
    titlebar_theme: 'Barra de título', titlebar_theme_description: 'Cambia el estilo de los controles de la ventana.',
    applied_next_login: 'Se aplica la próxima vez que abras la aplicación.',
    system_info: 'Información de la aplicación', local_data: 'Datos locales',
    local_data_description: 'Tus notas y preferencias se guardan en este equipo.',
    data_management: 'Datos y respaldo', backup_data: 'Crear copia de seguridad',
    backup_description: 'Guarda una copia SQLite de tus notas y preferencias para recuperarlas si lo necesitas.',
    backup_success: 'Copia de seguridad creada', backup_unavailable: 'La copia de seguridad no está disponible en este entorno.',
    reset_avatar: 'Usar avatar predeterminado', settings_loaded: 'Preferencias cargadas',
    about_text: 'Starcho JS es una aplicación local para crear, editar y organizar tus notas.',
  },
  en: {
    nav_home: 'Home', nav_notes: 'Notes', nav_settings: 'Settings', nav_modules: 'Modules',
    sidebar_collapse: 'Collapse', sidebar_expand: 'Expand', settings_title: 'Settings',
    profile: 'Profile', appearance: 'Appearance', theme: 'Theme', language: 'Language', about: 'About',
    full_name: 'Full name', nickname: 'Nickname', whatsapp: 'WhatsApp', save_profile: 'Save profile',
    user: 'User', your_name: 'Your name', nickname_placeholder: 'How should we call you?',
    optional: 'Optional', profile_saved: 'Profile saved', theme_dark: 'Dark', theme_light: 'Light',
    theme_ocean: 'Ocean', theme_neon: 'Neon', theme_pink: 'Pink', theme_red: 'Red',
    theme_matrix: 'Matrix', theme_arcade: 'Arcade', theme_military: 'Military', theme_kick: 'Kick',
    theme_winamp: 'Winamp', theme_rickmorty: 'Rick & Morty',
    settings_subtitle: 'Customize your Starcho JS profile, appearance, and preferences.',
    profile_description: 'This information appears on your profile and in the sidebar.', avatar: 'Avatar',
    change_avatar: 'Change avatar', remove_avatar: 'Remove avatar', avatar_hint: 'PNG, JPG, GIF, or WEBP. Maximum 350 KB.',
    choose_image: 'Choose image', avatar_invalid: 'Choose a valid image.', avatar_too_large: 'The image must be 350 KB or smaller.',
    save_changes: 'Save changes', saving: 'Saving…', saved: 'Saved',
    skin: 'Application skin', skin_description: 'Choose the colors and visual style for the whole application.',
    language_description: 'Change the interface language. It is saved for the next launch.',
    login_theme: 'Login screen skin', login_theme_description: 'Customize the screen shown before you enter your notes.',
    titlebar_theme: 'Title bar', titlebar_theme_description: 'Change the style of the window controls.',
    applied_next_login: 'Applied the next time you open the application.',
    system_info: 'Application information', local_data: 'Local data',
    local_data_description: 'Your notes and preferences are stored on this computer.',
    data_management: 'Data and backup', backup_data: 'Create backup',
    backup_description: 'Save a SQLite copy of your notes and preferences so you can recover them if needed.',
    backup_success: 'Backup created', backup_unavailable: 'Backup is not available in this environment.',
    reset_avatar: 'Use default avatar', settings_loaded: 'Preferences loaded',
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
