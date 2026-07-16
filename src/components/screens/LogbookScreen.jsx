import { useState } from "react";
import { STATUS_CYCLE } from "../../hooks/useLogbook.js";

const STATUS_CONFIG = {
  "not-started": { label: "Not started", icon: "○", color: "#444" },
  "in-progress": { label: "In progress", icon: "◐", color: "#ee9b00" },
  "mastered":    { label: "Mastered",    icon: "●", color: "#52b788" },
};

// ── Small reusable list editor (key points / best practices) ─────────────────
function ListEditor({ label, items, onChange, placeholder, accent }) {
  const add    = () => onChange([...items, ""]);
  const update = (i, v) => { const next = [...items]; next[i] = v; onChange(next); };
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 1 }}>{label}</span>
        <button onClick={add} style={{ fontSize: 11, color: accent, background: "transparent",
          border: `1px solid ${accent}44`, borderRadius: 5, padding: "3px 9px",
          cursor: "pointer", fontFamily: "inherit" }}>+ add</button>
      </div>
      {items.length === 0 && (
        <div style={{ fontSize: 12, color: "#333", fontStyle: "italic", marginBottom: 6 }}>None yet</div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <span style={{ marginTop: 11, width: 4, height: 4, borderRadius: "50%",
              background: accent, flexShrink: 0 }} />
            <textarea value={item} onChange={e => update(i, e.target.value)} placeholder={placeholder}
              rows={1}
              style={{ flex: 1, padding: "8px 10px", background: "#0f0f13", border: "1px solid #2a2a35",
                borderRadius: 7, color: "#ccc", fontSize: 13, fontFamily: "inherit", outline: "none",
                resize: "none", lineHeight: 1.5 }}
              onInput={e => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }} />
            <button onClick={() => remove(i)} style={{ background: "transparent", border: "none",
              color: "#444", fontSize: 14, cursor: "pointer", padding: "8px 2px" }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Code examples editor ──────────────────────────────────────────────────────
function CodeExampleEditor({ items, onChange, accent }) {
  const add    = () => onChange([...items, { id: `c${Date.now()}`, title: "", code: "" }]);
  const update = (i, field, v) => onChange(items.map((it, idx) => idx === i ? { ...it, [field]: v } : it));
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 1 }}>💻 Code Examples</span>
        <button onClick={add} style={{ fontSize: 11, color: accent, background: "transparent",
          border: `1px solid ${accent}44`, borderRadius: 5, padding: "3px 9px",
          cursor: "pointer", fontFamily: "inherit" }}>+ add</button>
      </div>
      {items.length === 0 && <div style={{ fontSize: 12, color: "#333", fontStyle: "italic" }}>None yet</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((item, i) => (
          <div key={item.id} style={{ background: "#0f0f13", border: "1px solid #1e1e24", borderRadius: 9, padding: 10 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input value={item.title} onChange={e => update(i, "title", e.target.value)}
                placeholder="What does this example show?"
                style={{ flex: 1, padding: "7px 10px", background: "#13131a", border: "1px solid #2a2a35",
                  borderRadius: 6, color: "#ccc", fontSize: 12, fontFamily: "inherit", outline: "none" }} />
              <button onClick={() => remove(i)} style={{ background: "transparent", border: "none",
                color: "#444", fontSize: 14, cursor: "pointer" }}>✕</button>
            </div>
            <textarea value={item.code} onChange={e => update(i, "code", e.target.value)}
              placeholder="// paste or write code here" rows={5} spellCheck={false}
              style={{ width: "100%", padding: "10px", background: "#0a0a0d", border: "1px solid #1e1e24",
                borderRadius: 6, color: "#a8d8b9", fontSize: 12, fontFamily: "monospace",
                outline: "none", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Q&A editor ─────────────────────────────────────────────────────────────────
function QAEditor({ items, onChange, accent }) {
  const add    = () => onChange([...items, { id: `q${Date.now()}`, question: "", answer: "" }]);
  const update = (i, field, v) => onChange(items.map((it, idx) => idx === i ? { ...it, [field]: v } : it));
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 1 }}>💬 Interview Q&A</span>
        <button onClick={add} style={{ fontSize: 11, color: accent, background: "transparent",
          border: `1px solid ${accent}44`, borderRadius: 5, padding: "3px 9px",
          cursor: "pointer", fontFamily: "inherit" }}>+ add</button>
      </div>
      {items.length === 0 && <div style={{ fontSize: 12, color: "#333", fontStyle: "italic" }}>None yet</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((item, i) => (
          <div key={item.id} style={{ background: "#0f0f13", border: "1px solid #1e1e24", borderRadius: 9, padding: 10,
            display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span style={{ width: 18, height: 18, borderRadius: 4, background: "#7b5ea722", color: "#c4b5fd",
                fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, marginTop: 2 }}>Q</span>
              <textarea value={item.question} onChange={e => update(i, "question", e.target.value)}
                placeholder="Interview question" rows={1}
                style={{ flex: 1, padding: "6px 8px", background: "#13131a", border: "1px solid #2a2a35",
                  borderRadius: 6, color: "#ccc", fontSize: 12, fontFamily: "inherit", outline: "none", resize: "none" }} />
              <button onClick={() => remove(i)} style={{ background: "transparent", border: "none",
                color: "#444", fontSize: 14, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span style={{ width: 18, height: 18, borderRadius: 4, background: "#52b78822", color: "#52b788",
                fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, marginTop: 2 }}>A</span>
              <textarea value={item.answer} onChange={e => update(i, "answer", e.target.value)}
                placeholder="Your model answer" rows={2}
                style={{ flex: 1, padding: "6px 8px", background: "#13131a", border: "1px solid #2a2a35",
                  borderRadius: 6, color: "#ccc", fontSize: 12, fontFamily: "inherit", outline: "none", resize: "none" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Entry form (create/edit) ──────────────────────────────────────────────────
function EntryForm({ draft, setDraft, categories, roadmaps, onSave, onCancel, accent }) {
  const [showLink, setShowLink] = useState(!!draft.roadmapId);
  const linkedRm = draft.roadmapId ? roadmaps[draft.roadmapId] : null;
  const linkedTopics = linkedRm ? Object.values(linkedRm.sections).flat()
    .map(t => typeof t === "string" ? t : t?.name).filter(Boolean) : [];

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })}
          placeholder="Entry title (e.g. HashMap Internals)" autoFocus
          style={{ flex: 1, padding: "11px 12px", background: "#0f0f13", border: "1px solid #2a2a35",
            borderRadius: 8, color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: "inherit", outline: "none" }} />
      </div>

      {/* Category */}
      <div>
        <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Category</div>
        <input value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })}
          placeholder="e.g. Core Java, Spring Security, SQL…" list="logbook-categories"
          style={{ width: "100%", padding: "9px 12px", background: "#0f0f13", border: "1px solid #2a2a35",
            borderRadius: 7, color: "#ccc", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
        <datalist id="logbook-categories">
          {categories.map(c => <option key={c} value={c} />)}
        </datalist>
      </div>

      {/* Link to roadmap topic */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 1 }}>🔗 Link to roadmap topic (optional)</span>
          {showLink && (
            <button onClick={() => { setShowLink(false); setDraft({ ...draft, roadmapId: null, topic: null }); }}
              style={{ fontSize: 11, color: "#444", background: "transparent", border: "none", cursor: "pointer" }}>
              Unlink
            </button>
          )}
        </div>
        {!showLink ? (
          <button onClick={() => setShowLink(true)}
            style={{ width: "100%", padding: "9px", background: "#0f0f13", border: "1px dashed #2a2a35",
              borderRadius: 7, color: "#555", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            + Link this entry to a roadmap topic
          </button>
        ) : (
          <div style={{ display: "flex", gap: 6 }}>
            <select value={draft.roadmapId || ""} onChange={e => setDraft({ ...draft, roadmapId: e.target.value || null, topic: null })}
              style={{ flex: 1, padding: "8px 10px", background: "#0f0f13", border: "1px solid #2a2a35",
                borderRadius: 7, color: "#ccc", fontSize: 12, fontFamily: "inherit", outline: "none" }}>
              <option value="">Select roadmap…</option>
              {Object.values(roadmaps).map(rm => <option key={rm.id} value={rm.id}>{rm.label}</option>)}
            </select>
            <select value={draft.topic || ""} onChange={e => setDraft({ ...draft, topic: e.target.value || null })}
              disabled={!draft.roadmapId}
              style={{ flex: 1, padding: "8px 10px", background: "#0f0f13", border: "1px solid #2a2a35",
                borderRadius: 7, color: "#ccc", fontSize: 12, fontFamily: "inherit", outline: "none" }}>
              <option value="">Select topic…</option>
              {linkedTopics.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        )}
        {showLink && draft.roadmapId && draft.topic && (
          <div style={{ fontSize: 11, color: "#52b788", marginTop: 6 }}>
            ✓ When marked "Mastered", this will auto-complete the topic
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>📖 Notes</div>
        <textarea value={draft.notes} onChange={e => setDraft({ ...draft, notes: e.target.value })}
          placeholder="Explain the concept in your own words…" rows={4}
          style={{ width: "100%", padding: "11px 12px", background: "#0f0f13", border: "1px solid #2a2a35",
            borderRadius: 8, color: "#ccc", fontSize: 13, fontFamily: "inherit", outline: "none",
            resize: "vertical", lineHeight: 1.6, boxSizing: "border-box" }} />
      </div>

      <ListEditor label="⭐ Key Points" items={draft.keyPoints}
        onChange={v => setDraft({ ...draft, keyPoints: v })}
        placeholder="An important fact worth remembering" accent={accent} />

      <CodeExampleEditor items={draft.codeExamples}
        onChange={v => setDraft({ ...draft, codeExamples: v })} accent={accent} />

      <QAEditor items={draft.qa} onChange={v => setDraft({ ...draft, qa: v })} accent={accent} />

      <ListEditor label="✓ Best Practices" items={draft.bestPractices}
        onChange={v => setDraft({ ...draft, bestPractices: v })}
        placeholder="A best practice or common pitfall to avoid" accent={accent} />

      <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
        <button onClick={onSave} disabled={!draft.title.trim()}
          style={{ flex: 1, padding: "12px", background: draft.title.trim() ? accent : "#1e1e24",
            border: "none", borderRadius: 9, color: draft.title.trim() ? "#fff" : "#444",
            fontSize: 14, fontWeight: 700, cursor: draft.title.trim() ? "pointer" : "default", fontFamily: "inherit" }}>
          💾 Save Entry
        </button>
        <button onClick={onCancel}
          style={{ padding: "12px 18px", background: "#1e1e24", border: "1px solid #2a2a35",
            borderRadius: 9, color: "#666", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Entry detail (read view) ──────────────────────────────────────────────────
function EntryDetail({ entry, roadmaps, onEdit, onDelete, onCycleStatus, onBack, accent }) {
  const sc = STATUS_CONFIG[entry.status];
  const linkedRm = entry.roadmapId ? roadmaps[entry.roadmapId] : null;
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #1e1e24",
        display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "transparent", border: "none",
          color: "#666", fontSize: 20, cursor: "pointer", padding: 0 }}>‹</button>
        <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, color: "#fff",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.title}</div>
        <button onClick={onEdit} style={{ background: "transparent", border: "none",
          color: "#7b5ea7", fontSize: 14, cursor: "pointer", padding: "4px" }}>✏️</button>
        <button onClick={() => setConfirmDelete(true)} style={{ background: "transparent", border: "none",
          color: "#444", fontSize: 14, cursor: "pointer", padding: "4px" }}>🗑️</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
          {entry.category && (
            <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 5, background: accent + "1a",
              color: accent, border: `1px solid ${accent}33` }}>{entry.category}</span>
          )}
          <button onClick={onCycleStatus}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent",
              border: `1px solid ${sc.color}44`, borderRadius: 6, padding: "4px 10px",
              cursor: "pointer", fontFamily: "inherit" }}>
            <span style={{ color: sc.color, fontSize: 13 }}>{sc.icon}</span>
            <span style={{ fontSize: 12, color: sc.color, fontWeight: 600 }}>{sc.label}</span>
          </button>
          {linkedRm && entry.topic && (
            <span style={{ fontSize: 11, color: "#555" }}>🔗 {linkedRm.label} → {entry.topic}</span>
          )}
        </div>

        {entry.notes && (
          <section style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>📖 Notes</div>
            <div style={{ fontSize: 14, color: "#ccc", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{entry.notes}</div>
          </section>
        )}

        {entry.keyPoints?.length > 0 && (
          <section style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>⭐ Key Points</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {entry.keyPoints.map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "#ccc", lineHeight: 1.6 }}>
                  <span style={{ marginTop: 7, width: 4, height: 4, borderRadius: "50%", background: accent, flexShrink: 0 }} />
                  {p}
                </div>
              ))}
            </div>
          </section>
        )}

        {entry.codeExamples?.length > 0 && (
          <section style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>💻 Code Examples</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {entry.codeExamples.map(c => (
                <div key={c.id} style={{ background: "#0f0f13", border: "1px solid #1e1e24", borderRadius: 9, overflow: "hidden" }}>
                  {c.title && (
                    <div style={{ padding: "8px 12px", borderBottom: "1px solid #1e1e24", fontSize: 12, color: "#888" }}>
                      {c.title}
                    </div>
                  )}
                  <pre style={{ margin: 0, padding: "12px", fontSize: 12, color: "#a8d8b9",
                    fontFamily: "monospace", lineHeight: 1.6, overflowX: "auto", whiteSpace: "pre" }}>
                    {c.code}
                  </pre>
                </div>
              ))}
            </div>
          </section>
        )}

        {entry.qa?.length > 0 && (
          <section style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>💬 Interview Q&A</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {entry.qa.map(item => (
                <div key={item.id} style={{ background: "#0f0f13", border: "1px solid #1e1e24", borderRadius: 9, padding: 12 }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <span style={{ width: 18, height: 18, borderRadius: 4, background: "#7b5ea722", color: "#c4b5fd",
                      fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>Q</span>
                    <div style={{ fontSize: 13, color: "#fff", fontWeight: 600, lineHeight: 1.6 }}>{item.question}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span style={{ width: 18, height: 18, borderRadius: 4, background: "#52b78822", color: "#52b788",
                      fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>A</span>
                    <div style={{ fontSize: 13, color: "#aaa", lineHeight: 1.6 }}>{item.answer}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {entry.bestPractices?.length > 0 && (
          <section>
            <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>✓ Best Practices</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {entry.bestPractices.map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "#ccc", lineHeight: 1.6 }}>
                  <span style={{ marginTop: 7, width: 4, height: 4, borderRadius: "50%", background: "#52b788", flexShrink: 0 }} />
                  {p}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {confirmDelete && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24, zIndex: 10 }}>
          <div style={{ background: "#16161b", border: "1px solid #2a2a35", borderRadius: 12,
            padding: 20, width: "100%", maxWidth: 300, textAlign: "center" }}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>🗑️</div>
            <div style={{ fontSize: 14, color: "#fff", marginBottom: 6 }}>Delete this entry?</div>
            <div style={{ fontSize: 12, color: "#555", marginBottom: 18 }}>This can't be undone.</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setConfirmDelete(false)}
                style={{ flex: 1, padding: "9px", background: "#1e1e24", border: "1px solid #2a2a35",
                  borderRadius: 7, color: "#888", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
              <button onClick={onDelete}
                style={{ flex: 1, padding: "9px", background: "#e05252", border: "none",
                  borderRadius: 7, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main LogbookScreen ────────────────────────────────────────────────────────
export function LogbookScreen({ entries, roadmaps, onAdd, onUpdate, onDelete, onCycleStatus, getStats, emptyEntry }) {
  const accent = "#d9a352"; // warm amber, distinct from the rest of the app's purple
  const [selectedId, setSelectedId] = useState(null);
  const [formOpen,   setFormOpen]   = useState(false);
  const [draft,      setDraft]      = useState(null);
  const [search,     setSearch]     = useState("");
  const [catFilter,  setCatFilter]  = useState(null);

  const categories = [...new Set(entries.map(e => e.category).filter(Boolean))].sort();
  const stats = getStats();

  const filtered = entries.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.title.toLowerCase().includes(q) || e.category.toLowerCase().includes(q) ||
      e.notes?.toLowerCase().includes(q);
    const matchCat = !catFilter || e.category === catFilter;
    return matchSearch && matchCat;
  });

  const grouped = categories
    .filter(c => !catFilter || c === catFilter)
    .map(cat => ({ cat, items: filtered.filter(e => e.category === cat) }))
    .filter(g => g.items.length > 0);
  const uncategorized = filtered.filter(e => !e.category);

  const selected = selectedId ? entries.find(e => e.id === selectedId) : null;

  const openNew = () => { setDraft(emptyEntry()); setFormOpen(true); setSelectedId(null); };
  const openEdit = (entry) => { setDraft({ ...entry }); setFormOpen(true); };
  const saveForm = () => {
    if (draft.id && entries.some(e => e.id === draft.id)) {
      onUpdate(draft.id, draft);
    } else {
      onAdd(draft);
    }
    setFormOpen(false);
    setSelectedId(draft.id);
  };
  const cancelForm = () => setFormOpen(false);

  // ── Detail / Edit view ──
  if (formOpen && draft) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #1e1e24",
          display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <button onClick={cancelForm} style={{ background: "transparent", border: "none",
            color: "#666", fontSize: 20, cursor: "pointer", padding: 0 }}>‹</button>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>
            {entries.some(e => e.id === draft.id) ? "Edit Entry" : "New Entry"}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          <EntryForm draft={draft} setDraft={setDraft} categories={categories} roadmaps={roadmaps}
            onSave={saveForm} onCancel={cancelForm} accent={accent} />
        </div>
      </div>
    );
  }

  if (selected) {
    return (
      <EntryDetail entry={selected} roadmaps={roadmaps}
        onEdit={() => openEdit(selected)}
        onDelete={() => { onDelete(selected.id); setSelectedId(null); }}
        onCycleStatus={() => onCycleStatus(selected.id)}
        onBack={() => setSelectedId(null)}
        accent={accent} />
    );
  }

  // ── List view ──
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid #1e1e24", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>📓 Logbook</div>
            <div style={{ fontSize: 11, color: "#555" }}>
              {stats.mastered} mastered · {stats.inProgress} in progress · {stats.notStarted} new
            </div>
          </div>
          <button onClick={openNew}
            style={{ padding: "8px 16px", background: accent, border: "none", borderRadius: 8,
              color: "#1a1407", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            + New
          </button>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search entries…"
          style={{ width: "100%", padding: "8px 12px", background: "#0f0f13", border: "1px solid #2a2a35",
            borderRadius: 8, color: "#888", fontSize: 12, fontFamily: "inherit", outline: "none",
            boxSizing: "border-box", marginBottom: categories.length > 0 ? 8 : 0 }} />
        {categories.length > 0 && (
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            <button onClick={() => setCatFilter(null)}
              style={{ fontSize: 10, padding: "3px 9px", borderRadius: 5, cursor: "pointer", fontFamily: "inherit",
                background: !catFilter ? accent + "22" : "transparent",
                border: `1px solid ${!catFilter ? accent + "44" : "#2a2a35"}`,
                color: !catFilter ? accent : "#555" }}>All</button>
            {categories.map(c => (
              <button key={c} onClick={() => setCatFilter(catFilter === c ? null : c)}
                style={{ fontSize: 10, padding: "3px 9px", borderRadius: 5, cursor: "pointer", fontFamily: "inherit",
                  background: catFilter === c ? accent + "22" : "transparent",
                  border: `1px solid ${catFilter === c ? accent + "44" : "#2a2a35"}`,
                  color: catFilter === c ? accent : "#555" }}>{c}</button>
            ))}
          </div>
        )}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
        {entries.length === 0 && (
          <div style={{ textAlign: "center", padding: "50px 20px", color: "#444" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📓</div>
            <div style={{ fontSize: 15, color: "#666", marginBottom: 6 }}>Your Logbook is empty</div>
            <div style={{ fontSize: 12, color: "#333", lineHeight: 1.7, marginBottom: 18, maxWidth: 260, marginLeft: "auto", marginRight: "auto" }}>
              Build deep, structured knowledge for any topic — key points, code examples,
              interview Q&A, and mastery tracking. Optionally link to a roadmap topic.
            </div>
            <button onClick={openNew}
              style={{ padding: "10px 22px", background: accent, border: "none", borderRadius: 8,
                color: "#1a1407", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              + Create First Entry
            </button>
          </div>
        )}

        {grouped.map(g => (
          <div key={g.cat} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, color: "#444", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{g.cat}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {g.items.map(e => {
                const sc = STATUS_CONFIG[e.status];
                return (
                  <div key={e.id} onClick={() => setSelectedId(e.id)}
                    style={{ background: "#16161b", border: "1px solid #1e1e24", borderRadius: 9,
                      padding: "11px 13px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ color: sc.color, fontSize: 14, flexShrink: 0 }}>{sc.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#ccc",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</div>
                      {e.roadmapId && e.topic && (
                        <div style={{ fontSize: 10, color: "#444", marginTop: 1 }}>🔗 {roadmaps[e.roadmapId]?.label}</div>
                      )}
                    </div>
                    <span style={{ color: "#333", fontSize: 16, flexShrink: 0 }}>›</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {!catFilter && uncategorized.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, color: "#444", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Uncategorized</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {uncategorized.map(e => {
                const sc = STATUS_CONFIG[e.status];
                return (
                  <div key={e.id} onClick={() => setSelectedId(e.id)}
                    style={{ background: "#16161b", border: "1px solid #1e1e24", borderRadius: 9,
                      padding: "11px 13px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ color: sc.color, fontSize: 14, flexShrink: 0 }}>{sc.icon}</span>
                    <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: "#ccc",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</div>
                    <span style={{ color: "#333", fontSize: 16, flexShrink: 0 }}>›</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {entries.length > 0 && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 24, color: "#444", fontSize: 13 }}>No entries match your search</div>
        )}
      </div>
    </div>
  );
}
