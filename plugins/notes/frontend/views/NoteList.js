/**
 * NoteList.js — full-page notes view for the Notes plugin.
 *
 * Structure:
 *  - Header bar (title + "New note" button)
 *  - Collapsible card list (one card per note, color-coded left border)
 *  - Edit / Create modal with title, content, date, and color picker
 */
import API        from '../../../../src/renderer/utils/api.js';
import { openModal, showToast, markFieldErrors, clearFieldErrors }
                  from '../../../../src/renderer/components/Modal.js';
import store      from '../../../../src/renderer/store.js';
import { esc, formGroup }
                  from '../../../../src/renderer/utils/html.js';
import { viewHeader }
                  from '../../../../src/renderer/components/ui.js';
import { t } from '../../../../src/renderer/utils/i18n.js';

// Available note accent colors shown in the color swatch picker
const COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#06b6d4','#ef4444','#64748b'];

export async function renderNoteList(el) {
  el.innerHTML = `<div class="nt-container">
    ${viewHeader(`📝 ${t('notes_title')}`, `<button class="nt-new-btn" id="nt-new-btn">+ ${t('new_note')}</button>`, 'nt-header')}
    <div class="nt-list" id="nt-list"><div class="nt-empty">${t('loading')}</div></div>
  </div>`;

  el.querySelector('#nt-new-btn').addEventListener('click', () => _openForm(null, _refresh));

  await _refresh();

  async function _refresh() {
    const listEl   = el.querySelector('#nt-list');
    const username = store.state.loggedUser?.username;
    try {
      const notes = await API.notes.list(username ? { username } : {});
      _renderList(listEl, notes, _refresh);
    } catch (err) {
      listEl.innerHTML = `<div class="nt-empty" style="color:var(--red)">${t('notes_load_error')}</div>`;
    }
  }
}

// ── List renderer ──────────────────────────────────────────────────────────────

function _renderList(container, notes, refresh) {
  if (!notes.length) {
    container.innerHTML = `<div class="nt-empty">${t('no_notes')}<br>${t('create_first_note')}</div>`;
    return;
  }

  container.innerHTML = notes.map(n => `
    <div class="nt-card" data-id="${n.id}" style="--note-color:${n.color}">
      <div class="nt-card-head">
        <div class="nt-color-bar"></div>
        <div class="nt-card-title">
          <span class="nt-title">${esc(n.title)}</span>
          ${n.important_date ? `<span class="nt-date">📅 ${n.important_date}</span>` : ''}
        </div>
        <button class="nt-toggle-btn" title="${t('expand')} / ${t('collapse')}">▼</button>
      </div>
      <div class="nt-card-body">
        ${n.content
          ? `<div class="nt-content">${esc(n.content)}</div>`
          : `<div class="nt-content-empty">${t('no_content')}</div>`}
        <div class="nt-actions">
          <button class="nt-action-btn nt-edit" data-id="${n.id}">✏️ ${t('edit')}</button>
          <button class="nt-action-btn danger nt-del" data-id="${n.id}">🗑️ ${t('delete')}</button>
        </div>
      </div>
    </div>`).join('');

  // Toggle expand/collapse on card head click
  container.querySelectorAll('.nt-card-head').forEach(head => {
    head.addEventListener('click', () => head.closest('.nt-card').classList.toggle('expanded'));
  });

  // Edit
  container.querySelectorAll('.nt-edit').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const note = notes.find(n => n.id === parseInt(btn.dataset.id));
      if (note) _openForm(note, refresh);
    });
  });

  // Delete
  container.querySelectorAll('.nt-del').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      if (!confirm(t('delete_note_confirm'))) return;
      await API.notes.delete(parseInt(btn.dataset.id));
      showToast(t('note_deleted'), 'success');
      refresh();
    });
  });
}

// ── Create / Edit form modal ───────────────────────────────────────────────────

function _openForm(note, onSaved) {
  const isEdit   = !!note;
  const selColor = note?.color || '#6366f1';

  // Color swatch buttons rendered inside the form
  const colorSwatches = COLORS.map(c => `
    <span class="nt-color-swatch ${c === selColor ? 'selected' : ''}"
          data-color="${c}" style="background:${c}" title="${c}"></span>`).join('');

  openModal({
    title: isEdit ? `✏️ ${t('edit_note')}` : `📝 ${t('new_note')}`,
    content: `
      ${formGroup({ label: `${t('note_title')} *`, id: 'nt-f-title', dataField: 'title', placeholder: t('note_title_placeholder'), value: esc(note?.title || '') })}
      ${formGroup({ label: t('note_content'), id: 'nt-f-content', dataField: 'content', type: 'textarea', rows: 5, placeholder: t('note_content_placeholder'), value: esc(note?.content || '') })}
      ${formGroup({ label: t('important_date'), id: 'nt-f-date', dataField: 'important_date', type: 'date', value: note?.important_date || '' })}
      <div class="form-group">
        <label>${t('color')}</label>
        <div class="nt-color-row" id="nt-color-row">${colorSwatches}</div>
        <input type="hidden" id="nt-f-color" value="${selColor}">
      </div>`,
    actions: [
      { label: t('cancel'), class: 'btn-secondary', action: close => close() },
      {
        label: isEdit ? t('update_note') : t('create_note'),
        class: 'btn-primary',
        action: async (close, formEl) => {
          clearFieldErrors(formEl);
          const title    = formEl.querySelector('#nt-f-title').value.trim();
          const content  = formEl.querySelector('#nt-f-content').value.trim();
          const date     = formEl.querySelector('#nt-f-date').value;
          const color    = formEl.querySelector('#nt-f-color').value;
          const username = store.state.loggedUser?.username;
          const payload  = { title, content: content || null, color, important_date: date || null, username };

          try {
            if (isEdit) {
              await API.notes.update(note.id, payload);
              showToast(t('note_updated'), 'success');
            } else {
              await API.notes.create(payload);
              showToast(t('note_created'), 'success');
            }
            close();
            onSaved();
          } catch (err) {
            markFieldErrors(err.fields, formEl);
            showToast(t('note_save_error'), 'error');
          }
        },
      },
    ],
  });

  // Wire color picker — scoped to the last open modal overlay
  setTimeout(() => {
    const modalEl = document.querySelector('.modal-overlay:last-child');
    if (!modalEl) return;
    modalEl.querySelectorAll('.nt-color-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        modalEl.querySelectorAll('.nt-color-swatch').forEach(s => s.classList.remove('selected'));
        swatch.classList.add('selected');
        modalEl.querySelector('#nt-f-color').value = swatch.dataset.color;
      });
    });
    modalEl.querySelector('#nt-f-title')?.focus();
  }, 80);
}
