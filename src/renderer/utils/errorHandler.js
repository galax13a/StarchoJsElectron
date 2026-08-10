'use strict';

export function logError(err) {
  const msg = err instanceof Error
    ? `ERROR: ${err.name}: ${err.message}${err.stack ? '\n' + err.stack : ''}`
    : `ERROR: ${String(err)}`;
  console.error('[ErrorHandler]', err);
  window.electronAPI?.logError?.(msg);
}

export function logWarn(msg) {
  console.warn('[Warn]', msg);
  window.electronAPI?.logError?.(`WARN: ${String(msg)}`);
}

export function initErrorHandler(onFatal) {
  window.onerror = (_msg, _src, _line, _col, err) => {
    const failure = err || `${_msg} (${_src}:${_line}:${_col})`;
    logError(failure);
    onFatal?.(failure);
    return false;
  };
  window.addEventListener('unhandledrejection', (e) => {
    const failure = e.reason || 'Unhandled promise rejection';
    logError(failure);
    onFatal?.(failure);
  });
}
