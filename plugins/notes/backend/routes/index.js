'use strict';

const router = require('express').Router();
const { validate } = require('../../../../src/backend/middleware/validate');
const { IdParamsSchema, NoteQuerySchema, NoteCreateSchema, NoteUpdateSchema } = require('../schemas/notes');

function userId(db, username) {
  if (!username) return null;
  const row = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  return row ? row.id : null;
}

// GET /api/notes
router.get('/', validate(NoteQuerySchema, 'query'), (req, res) => {
  try {
    const db  = req.db;
    const uid = userId(db, req.auth?.username);
    const rows = uid
      ? db.prepare('SELECT * FROM notes WHERE (user_id = ? OR user_id IS NULL) AND deleted_at IS NULL ORDER BY updated_at DESC').all(uid)
      : [];
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/notes/:id
router.get('/:id', validate(IdParamsSchema, 'params'), (req, res) => {
  try {
    const uid = userId(req.db, req.auth?.username);
    const row = req.db.prepare('SELECT * FROM notes WHERE id = ? AND (user_id = ? OR user_id IS NULL) AND deleted_at IS NULL').get(req.params.id, uid);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/notes
router.post('/', validate(NoteCreateSchema), (req, res) => {
  try {
    const db  = req.db;
    const { title, content, color, important_date } = req.body;
    const uid = userId(db, req.auth?.username);
    const info = db.prepare(
      'INSERT INTO notes (title, content, color, important_date, user_id) VALUES (?, ?, ?, ?, ?)'
    ).run(title, content || null, color || '#6366f1', important_date || null, uid);
    res.json(db.prepare('SELECT * FROM notes WHERE id = ?').get(info.lastInsertRowid));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/notes/:id
router.put('/:id', validate(IdParamsSchema, 'params'), validate(NoteUpdateSchema), (req, res) => {
  try {
    const db = req.db;
    const { title, content, color, important_date } = req.body;
    const uid = userId(db, req.auth?.username);
    db.prepare(
      'UPDATE notes SET user_id=COALESCE(user_id, ?), title=?, content=?, color=?, important_date=?, updated_at=CURRENT_TIMESTAMP WHERE id=? AND (user_id=? OR user_id IS NULL) AND deleted_at IS NULL'
    ).run(uid, title, content || null, color || '#6366f1', important_date || null, req.params.id, uid);
    const row = db.prepare('SELECT * FROM notes WHERE id = ? AND (user_id = ? OR user_id IS NULL)').get(req.params.id, uid);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/notes/:id  (soft delete)
router.delete('/:id', validate(IdParamsSchema, 'params'), (req, res) => {
  try {
    const uid = userId(req.db, req.auth?.username);
    req.db.prepare('UPDATE notes SET deleted_at=CURRENT_TIMESTAMP WHERE id=? AND (user_id=? OR user_id IS NULL)').run(req.params.id, uid);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
