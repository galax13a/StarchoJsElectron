'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { startServer, stopServer } = require('../src/backend/server');
const { hashPassword, verifyPassword } = require('../src/backend/auth/passwords');

test('password hashes use salted scrypt and verify correctly', () => {
  const hash = hashPassword('correct horse battery staple');
  assert.match(hash, /^scrypt\$/);
  assert.equal(verifyPassword('correct horse battery staple', hash), true);
  assert.equal(verifyPassword('wrong password', hash), false);
});

test('API requires a session and isolates the authenticated notes flow', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'starcho-js-test-'));
  const dbPath = path.join(tempDir, 'test.db');
  const username = `test-${Date.now()}`;
  let port;

  try {
    port = await startServer({ db: dbPath, userData: tempDir }, 0);
    const base = `http://127.0.0.1:${port}`;
    const json = async (url, options) => {
      const response = await fetch(`${base}${url}`, options);
      return { response, data: await response.json().catch(() => ({})) };
    };

    const unauthenticated = await json('/api/settings');
    assert.equal(unauthenticated.response.status, 401);

    const registered = await json('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: 'secret123' }),
    });
    assert.equal(registered.response.status, 200);

    const loggedIn = await json('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: 'secret123' }),
    });
    assert.equal(loggedIn.response.status, 200);
    assert.ok(loggedIn.data.token);
    const storedSession = require('../src/backend/database/connection')
      .getDb()
      .prepare('SELECT token FROM app_sessions WHERE username = ?')
      .get(username);
    assert.equal(
      storedSession.token,
      crypto.createHash('sha256').update(loggedIn.data.token).digest('hex'),
    );
    assert.notEqual(storedSession.token, loggedIn.data.token);

    const queryToken = await json(
      `/api/auth/validate?token=${encodeURIComponent(loggedIn.data.token)}`,
    );
    assert.equal(queryToken.response.status, 401);

    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${loggedIn.data.token}`,
    };
    const profile = await json('/api/auth/profile', { headers: authHeaders });
    assert.equal(profile.response.status, 200);
    assert.equal(profile.data.username, username);
    assert.equal(profile.response.headers.get('cache-control'), 'no-store');
    assert.equal(profile.response.headers.get('x-content-type-options'), 'nosniff');

    const updatedProfile = await json('/api/auth/profile', {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        username,
        full_name: 'Persona de Prueba',
        nickname: 'Tester',
        whatsapp: '+57 300 000 0000',
        avatar: 'data:image/png;base64,ZmFrZQ==',
      }),
    });
    assert.equal(updatedProfile.response.status, 200);
    const profileAfterUpdate = await json('/api/auth/profile', { headers: authHeaders });
    assert.equal(profileAfterUpdate.data.full_name, 'Persona de Prueba');
    assert.equal(profileAfterUpdate.data.nickname, 'Tester');
    assert.equal(profileAfterUpdate.data.avatar, 'data:image/png;base64,ZmFrZQ==');

    const oversizedAvatar = await json('/api/auth/profile', {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ username, avatar: `data:image/png;base64,${'a'.repeat(500_001)}` }),
    });
    assert.equal(oversizedAvatar.response.status, 400);

    const settingsSaved = await json('/api/settings', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ theme: 'ocean', language: 'en' }),
    });
    assert.equal(settingsSaved.response.status, 200);
    const settings = await json('/api/settings', { headers: authHeaders });
    assert.equal(settings.response.status, 200);
    assert.equal(settings.data.theme, 'ocean');
    assert.equal(settings.data.language, 'en');

    const created = await json('/api/notes', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Nota protegida',
        content: 'Contenido de prueba',
        username: 'otro-usuario',
      }),
    });
    assert.equal(created.response.status, 200);
    assert.equal(created.data.title, 'Nota protegida');

    const listed = await json('/api/notes', { headers: authHeaders });
    assert.equal(listed.response.status, 200);
    assert.ok(listed.data.some((note) => note.id === created.data.id));

    const updated = await json(`/api/notes/${created.data.id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ title: 'Nota actualizada', content: 'Actualizada' }),
    });
    assert.equal(updated.response.status, 200);
    assert.equal(updated.data.title, 'Nota actualizada');

    const otherUsername = `${username}-other`;
    await json('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: otherUsername, password: 'secret123' }),
    });
    const otherLogin = await json('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: otherUsername, password: 'secret123' }),
    });
    const otherHeaders = { Authorization: `Bearer ${otherLogin.data.token}` };
    const otherList = await json('/api/notes', { headers: otherHeaders });
    assert.equal(otherList.response.status, 200);
    assert.equal(
      otherList.data.some((note) => note.id === created.data.id),
      false,
    );

    const otherRead = await json(`/api/notes/${created.data.id}`, { headers: otherHeaders });
    assert.equal(otherRead.response.status, 404);

    const deleted = await json(`/api/notes/${created.data.id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    assert.equal(deleted.response.status, 200);
  } finally {
    await stopServer();
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('login throttling and server shutdown are observable', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'starcho-js-lifecycle-'));
  let port;
  try {
    port = await startServer({ db: path.join(tempDir, 'test.db'), userData: tempDir }, 0);
    const base = `http://127.0.0.1:${port}`;
    const badLogin = () =>
      fetch(`${base}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'missing-user', password: 'wrong-password' }),
      });
    for (let attempt = 0; attempt < 5; attempt += 1) {
      assert.equal((await badLogin()).status, 401);
    }
    assert.equal((await badLogin()).status, 429);
  } finally {
    await stopServer();
  }

  await assert.rejects(
    fetch(`http://127.0.0.1:${port}/ping`),
    /fetch failed|ECONNREFUSED|network/i,
  );
  fs.rmSync(tempDir, { recursive: true, force: true });
});
