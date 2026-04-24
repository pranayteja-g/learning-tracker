import { useState } from "react";

const STATUS_CONFIG = {
  idea: { label: "Idea", color: "#666", bg: "#1e1e24", icon: "💡" },
  inprogress: { label: "In Progress", color: "#ee9b00", bg: "#2e1e00", icon: "🔨" },
  completed: { label: "Completed", color: "#52b788", bg: "#1a2e1a", icon: "✅" },
};

function MilestoneTracker({ milestones, projId, rmId, onToggle }) {
  const done = milestones.filter((m) => m.done).length;
  const total = milestones.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 1 }}>
          Milestones
        </span>
        <span style={{ fontSize: 11, color: "#888" }}>
          {done}/{total}
        </span>
      </div>
      <div style={{ background: "#1e1e24", borderRadius: 3, height: 4, overflow: "hidden", marginBottom: 10 }}>
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: "#52b788",
            borderRadius: 3,
            transition: "width 0.3s",
          }}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {milestones.map((m, i) => (
          <div
            key={i}
            onClick={() => onToggle(rmId, projId, i)}
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              cursor: "pointer",
              padding: "8px 10px",
              borderRadius: 7,
              background: m.done ? "#1a2e1a" : "#0f0f13",
              border: `1px solid ${m.done ? "#52b78833" : "#1e1e24"}`,
              transition: "all 0.15s",
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 3,
                flexShrink: 0,
                marginTop: 1,
                border: `2px solid ${m.done ? "#52b788" : "#333"}`,
                background: m.done ? "#52b788" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {m.done && <span style={{ color: "#fff", fontSize: 10 }}>✓</span>}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 12,
                  color: m.done ? "#52b788" : "#ccc",
                  textDecoration: m.done ? "line-through" : "none",
                  textDecorationColor: "#52b78866",
                }}
              >
                {m.title || m}
              </div>
              {m.desc && <div style={{ fontSize: 11, color: "#444", marginTop: 2, lineHeight: 1.4 }}>{m.desc}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectDetail({ project, rm, onSetStatus, onToggleMilestone, onDelete, onBack }) {
  const [showHints, setShowHints] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const sc = STATUS_CONFIG[project.status];

  const milestonesDone = project.milestones?.filter((m) => m.done).length || 0;
  const milestonesTotal = project.milestones?.length || 0;
  const allDone = milestonesTotal > 0 && milestonesDone === milestonesTotal;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #1e1e24",
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexShrink: 0,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "transparent",
            border: "none",
            color: "#666",
            fontSize: 20,
            cursor: "pointer",
            padding: 0,
            lineHeight: 1,
          }}
        >
          ‹
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#fff",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {project.title}
          </div>
          <div style={{ fontSize: 11, color: sc.color }}>
            {sc.icon} {sc.label}
          </div>
        </div>
        <button
          onClick={() => setShowDelete(true)}
          style={{
            background: "transparent",
            border: "none",
            color: "#444",
            fontSize: 14,
            cursor: "pointer",
            padding: "4px",
          }}
        >
          🗑️
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {Object.entries(STATUS_CONFIG).map(([s, cfg]) => (
            <button
              key={s}
              onClick={() => onSetStatus(s)}
              style={{
                flex: 1,
                padding: "7px 4px",
                background: project.status === s ? cfg.bg : "transparent",
                border: `1px solid ${project.status === s ? cfg.color : "#2a2a35"}`,
                borderRadius: 7,
                color: project.status === s ? cfg.color : "#444",
                fontSize: 10,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {cfg.icon} {cfg.label}
            </button>
          ))}
        </div>

        {allDone && project.status !== "completed" && (
          <div
            style={{
              background: "#1a2e1a",
              border: "1px solid #52b78844",
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: 12, color: "#52b788" }}>🎉 All milestones done!</span>
            <button
              onClick={() => onSetStatus("completed")}
              style={{
                padding: "5px 12px",
                background: "#52b788",
                border: "none",
                borderRadius: 6,
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Mark Complete
            </button>
          </div>
        )}

        <div style={{ fontSize: 13, color: "#aaa", lineHeight: 1.7, marginBottom: 16 }}>{project.description}</div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 16 }}>
          <span
            style={{
              fontSize: 10,
              padding: "2px 8px",
              borderRadius: 4,
              background: project.difficulty === "beginner" ? "#52b78822" : "#ee9b0022",
              color: project.difficulty === "beginner" ? "#52b788" : "#ee9b00",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            {project.difficulty}
          </span>
          {project.estimatedTime && <span style={{ fontSize: 11, color: "#555" }}>⏱ {project.estimatedTime}</span>}
          {project.topics?.map((t) => (
            <span
              key={t}
              style={{
                fontSize: 10,
                padding: "2px 7px",
                borderRadius: 4,
                background: rm.color + "1a",
                color: rm.accent,
                border: `1px solid ${rm.color}33`,
              }}
            >
              {t}
            </span>
          ))}
        </div>

        {project.milestones?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <MilestoneTracker milestones={project.milestones} projId={project.id} rmId={rm.id} onToggle={onToggleMilestone} />
          </div>
        )}

        {project.hints?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <button
              onClick={() => setShowHints((h) => !h)}
              style={{
                width: "100%",
                padding: "9px 12px",
                background: "#0f0f13",
                border: "1px solid #2a2a35",
                borderRadius: 8,
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: showHints ? 8 : 0,
              }}
            >
              <span style={{ fontSize: 12, color: "#888" }}>💡 Hints ({project.hints.length})</span>
              <span style={{ fontSize: 11, color: "#444" }}>{showHints ? "▲" : "▼"}</span>
            </button>
            {showHints &&
              project.hints.map((h, i) => (
                <div
                  key={i}
                  style={{
                    padding: "10px 12px",
                    background: "#1a1a2e",
                    border: "1px solid #7b5ea733",
                    borderRadius: 7,
                    marginBottom: 5,
                    fontSize: 12,
                    color: "#c4b5fd",
                    lineHeight: 1.6,
                  }}
                >
                  {i + 1}. {h}
                </div>
              ))}
          </div>
        )}

        {project.links?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
              Resources
            </div>
            {project.links.map((l, i) => (
              <a
                key={i}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 12px",
                  background: "#0f0f13",
                  borderRadius: 8,
                  border: "1px solid #1e1e24",
                  textDecoration: "none",
                  marginBottom: 6,
                }}
              >
                <span style={{ fontSize: 14 }}>🔗</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#c4b5fd",
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {l.title}
                  </div>
                  {l.desc && <div style={{ fontSize: 10, color: "#555" }}>{l.desc}</div>}
                </div>
                <span style={{ color: "#444", fontSize: 12 }}>↗</span>
              </a>
            ))}
          </div>
        )}

        {project.completedAt && (
          <div style={{ fontSize: 11, color: "#52b788", textAlign: "center", marginTop: 8 }}>
            ✅ Completed {new Date(project.completedAt).toLocaleDateString()}
          </div>
        )}
      </div>

      {showDelete && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            zIndex: 10,
          }}
        >
          <div
            style={{
              background: "#16161b",
              border: "1px solid #2a2a35",
              borderRadius: 12,
              padding: "20px",
              width: "100%",
              maxWidth: 300,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>🗑️</div>
            <div style={{ fontSize: 14, color: "#fff", marginBottom: 6 }}>Delete this project?</div>
            <div style={{ fontSize: 12, color: "#555", marginBottom: 20 }}>This can't be undone.</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setShowDelete(false)}
                style={{
                  flex: 1,
                  padding: "9px",
                  background: "#1e1e24",
                  border: "1px solid #2a2a35",
                  borderRadius: 7,
                  color: "#888",
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Cancel
              </button>
              <button
                onClick={onDelete}
                style={{
                  flex: 1,
                  padding: "9px",
                  background: "#e05252",
                  border: "none",
                  borderRadius: 7,
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ProjectBoard({ rm, projects, onSetStatus, onToggleMilestone, onDelete, onClose }) {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");

  const proj = selected ? projects.find((p) => p.id === selected) : null;

  const groups = {
    inprogress: projects.filter((p) => p.status === "inprogress"),
    idea: projects.filter((p) => p.status === "idea"),
    completed: projects.filter((p) => p.status === "completed"),
  };

  const filtered = filter === "all" ? projects : projects.filter((p) => p.status === filter);

  if (proj) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#0f0f13",
          zIndex: 200,
          display: "flex",
          flexDirection: "column",
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <ProjectDetail
          project={proj}
          rm={rm}
          onSetStatus={(s) => onSetStatus(rm.id, proj.id, s)}
          onToggleMilestone={onToggleMilestone}
          onDelete={() => {
            onDelete(rm.id, proj.id);
            setSelected(null);
          }}
          onBack={() => setSelected(null)}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#0f0f13",
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid #1e1e24",
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "#13131a",
          flexShrink: 0,
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            color: "#666",
            fontSize: 20,
            cursor: "pointer",
            padding: 0,
            lineHeight: 1,
          }}
        >
          ‹
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>🔨 Projects</div>
          <div style={{ fontSize: 11, color: "#555" }}>{rm.label}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span style={{ fontSize: 11, color: "#ee9b00" }}>{groups.inprogress.length} active</span>
          <span style={{ fontSize: 11, color: "#52b788" }}>{groups.completed.length} done</span>
        </div>
      </div>

      <div style={{ display: "flex", borderBottom: "1px solid #1e1e24", background: "#13131a", flexShrink: 0 }}>
        {[["all", "All"], ["inprogress", "🔨 Active"], ["idea", "💡 Ideas"], ["completed", "✅ Done"]].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            style={{
              flex: 1,
              padding: "9px 4px",
              border: "none",
              background: "transparent",
              fontSize: 11,
              fontWeight: filter === v ? 700 : 400,
              color: filter === v ? "#fff" : "#555",
              borderBottom: filter === v ? `2px solid ${rm.color}` : "2px solid transparent",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#444" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>
              {filter === "completed" ? "🏁" : filter === "inprogress" ? "🔨" : "💡"}
            </div>
            <div style={{ fontSize: 14, marginBottom: 6 }}>No projects here yet</div>
            <div style={{ fontSize: 12, color: "#333", lineHeight: 1.6 }}>
              {filter === "all"
                ? "Generate projects from Practice → Study → 🔨 Project"
                : filter === "inprogress"
                  ? "Tap a project and set its status to 'In Progress'"
                  : filter === "completed"
                    ? "Tap a project and mark it complete when done"
                    : "Generate projects from Practice → Study → 🔨 Project"}
            </div>
          </div>
        ) : (
          filtered.map((p) => {
            const sc = STATUS_CONFIG[p.status];
            const mDone = p.milestones?.filter((m) => m.done).length || 0;
            const mTotal = p.milestones?.length || 0;
            const pct = mTotal ? Math.round((mDone / mTotal) * 100) : 0;
            return (
              <div
                key={p.id}
                onClick={() => setSelected(p.id)}
                style={{
                  background: p.status === "completed" ? "#0f1f0f" : p.status === "inprogress" ? "#1c1800" : "#16161b",
                  border: `1px solid ${p.status === "completed" ? "#52b78855" : p.status === "inprogress" ? "#ee9b0055" : "#2a2a35"}`,
                  borderLeft: `3px solid ${p.status === "completed" ? "#52b788" : p.status === "inprogress" ? "#ee9b00" : "#333"}`,
                  borderRadius: 10,
                  padding: "13px 14px",
                  marginBottom: 10,
                  cursor: "pointer",
                  overflow: "hidden",
                }}
              >
                {mTotal > 0 && p.status === "inprogress" && (
                  <div style={{ height: 3, background: "#2a2a00", borderRadius: 2, overflow: "hidden", marginBottom: 10 }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: "#ee9b00",
                        borderRadius: 2,
                        transition: "width 0.3s",
                      }}
                    />
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        marginBottom: 5,
                        color: p.status === "completed" ? "#52b788" : p.status === "inprogress" ? "#fff" : "#aaa",
                        textDecoration: p.status === "completed" ? "line-through" : "none",
                        textDecorationColor: "#52b78866",
                      }}
                    >
                      {sc.icon} {p.title}
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: sc.bg, color: sc.color, fontWeight: 700 }}>
                        {sc.label}
                      </span>
                      <span style={{ fontSize: 10, color: "#444" }}>·</span>
                      <span
                        style={{
                          fontSize: 10,
                          color: p.difficulty === "beginner" ? "#52b788" : "#ee9b00",
                          textTransform: "uppercase",
                          fontWeight: 700,
                        }}
                      >
                        {p.difficulty}
                      </span>
                      {mTotal > 0 && (
                        <>
                          <span style={{ fontSize: 10, color: "#444" }}>·</span>
                          <span style={{ fontSize: 10, color: "#666" }}>
                            {mDone}/{mTotal} steps
                          </span>
                        </>
                      )}
                      {p.estimatedTime && (
                        <>
                          <span style={{ fontSize: 10, color: "#444" }}>·</span>
                          <span style={{ fontSize: 10, color: "#444" }}>⏱ {p.estimatedTime}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span style={{ color: "#333", fontSize: 18, flexShrink: 0 }}>›</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
