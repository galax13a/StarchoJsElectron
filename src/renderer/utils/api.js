let BASE = 'http://127.0.0.1:3847';

function setBase(url) { BASE = url; }

async function request(method, path, body) {
  const options = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) options.body = JSON.stringify(body);
  const response = await fetch(`${BASE}/api${path}`, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || `HTTP ${response.status}`);
    error.status = response.status;
    error.fields = data.fields || null;
    throw error;
  }
  return data;
}

const qs = (obj) => Object.entries(obj)
  .filter(([, value]) => value !== null && value !== undefined && value !== '')
  .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
  .join('&');

const API = {
  setBase,
  config: { get: () => request('GET', '/config') },
  auth: {
    getProfile: (username) => request('GET', `/auth/profile?username=${encodeURIComponent(username)}`),
    updateProfile: (data) => request('PUT', '/auth/profile', data),
  },
  plugins: {
    list: () => request('GET', '/plugins'),
    setEnabled: (id, enabled) => request('PUT', `/plugins/${id}`, { enabled }),
  },
  notes: {
    list: (query = {}) => request('GET', `/notes?${qs(query)}`),
    get: (id) => request('GET', `/notes/${id}`),
    create: (data) => request('POST', '/notes', data),
    update: (id, data) => request('PUT', `/notes/${id}`, data),
    delete: (id) => request('DELETE', `/notes/${id}`),
  },
  settings: {
    getAll: () => request('GET', '/settings'),
    setMany: (data) => request('POST', '/settings', data),
  },
};

export default API;
export { setBase };
