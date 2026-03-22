import { useState } from "react";

function MilestoneList({ milestones }) {
  const [checked, setChecked] = useState({});
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {milestones.map((m, i) => (
        <div key={i} onClick={() => setChecked(c => ({ ...c, [i]: !c[i] }))}
          style={{ display: "flex", gap: 10, alignItems: "flex-start",
            cursor: "pointer", padding: "8px 10px", borderRadius: 7,
            background: checked[i] ? "#1a2e1a" : "#0f0f13",
            border: `1px solid ${checked[i] ? "#52b78833" : "#1e1e24"}`,
            transition: "all 0.2s" }}>
          <div style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 1,
            border: `2px solid ${checked[i] ? "#52b788" : "#333"}`,
            background: checked[i] ? "#52b788" : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            {checked[i] && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: checked[i] ? "#52b788" : "#ccc",
              textDecoration: checked[i] ? "line-through" : "none",
              textDecorationColor: "#52b78866" }}>
              {m.title || m}
            </div>
            {m.desc && <div style={{ fontSize: 11, color: "#555", marginTop: 2, lineHeight: 1.4 }}>{m.desc}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function HintAccordion({ hints }) {
  const [open, setOpen] = useState(null);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {hints.map((h, i) => (
        <div key={i} style={{ borderRadius: 7, overflow: "hidden",
          border: "1px solid #2a2a35" }}>
          <button onClick={() => setOpen(o => o === i ? null : i)}
            style={{ width: "100%", padding: "9px 12px", background: open === i ? "#1a1a2e" : "#0f0f13",
              border: "none", cursor: "pointer", fontFamily: "inherit",
              display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#888" }}>💡 Hint {i + 1}</span>
            <span style={{ fontSize: 12, color: "#444" }}>{open === i ? "▲" : "▼"}</span>
          </button>
          {open === i && (
            <div style={{ padding: "10px 12px", background: "#1a1a2e",
              fontSize: 13, color: "#c4b5fd", lineHeight: 1.6 }}>
              {h}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ProjectCard({ project, color, accent }) {
  const [section, setSection] = useState("overview"); // overview | milestones | hints | links

  const diffColor = project.difficulty === "beginner" ? "#52b788"
    : project.difficulty === "intermediate" ? "#ee9b00" : "#e05252";

  const tabs = [
    { id: "overview",   label: "Overview"    },
    { id: "milestones", label: "Milestones"  },
    project.hints?.length   && { id: "hints",  label: "Hints"  },
    project.links?.length   && { id: "links",  label: "Links"  },
  ].filter(Boolean);

  return (
    <div style={{ background: "#16161b", border: `1px solid ${color}33`,
      borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>

      {/* Header */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid #1e1e24" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <div style={{ flex: 1, marginRight: 10 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 3 }}>
              {project.title}
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4,
                background: diffColor + "22", color: diffColor, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: 0.5 }}>
                {project.difficulty}
              </span>
              {project.estimatedTime && (
                <span style={{ fontSize: 11, color: "#555" }}>⏱ {project.estimatedTime}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #1e1e24", background: "#13131a" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setSection(t.id)}
            style={{ flex: 1, padding: "8px 4px", border: "none", background: "transparent",
              fontSize: 11, fontWeight: section === t.id ? 700 : 400,
              color: section === t.id ? accent : "#555",
              borderBottom: section === t.id ? `2px solid ${color}` : "2px solid transparent",
              cursor: "pointer", fontFamily: "inherit" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "14px 16px" }}>

        {section === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 13, color: "#aaa", lineHeight: 1.7 }}>
              {project.description}
            </div>
            {project.topics?.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase",
                  letterSpacing: 1, marginBottom: 7 }}>Topics Practiced</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {project.topics.map(t => (
                    <span key={t} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 5,
                      background: color + "1a", color: accent,
                      border: `1px solid ${color}33` }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {project.outcome && (
              <div style={{ background: "#0f0f13", borderRadius: 8, padding: "10px 12px",
                border: "1px solid #1e1e24" }}>
                <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase",
                  letterSpacing: 1, marginBottom: 4 }}>What you'll build</div>
                <div style={{ fontSize: 12, color: "#888", lineHeight: 1.6 }}>{project.outcome}</div>
              </div>
            )}
          </div>
        )}

        {section === "milestones" && project.milestones?.length > 0 && (
          <MilestoneList milestones={project.milestones} />
        )}

        {section === "hints" && project.hints?.length > 0 && (
          <HintAccordion hints={project.hints} />
        )}

        {section === "links" && project.links?.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {project.links.map((l, i) => (
              <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                  background: "#0f0f13", borderRadius: 8, border: "1px solid #1e1e24",
                  textDecoration: "none" }}>
                <span style={{ fontSize: 16 }}>🔗</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: "#c4b5fd", fontWeight: 600,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {l.title}
                  </div>
                  {l.desc && <div style={{ fontSize: 11, color: "#555", marginTop: 1 }}>{l.desc}</div>}
                </div>
                <span style={{ fontSize: 12, color: "#444", flexShrink: 0 }}>↗</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ProjectView({ projects, rm }) {
  const color  = rm?.color  || "#7b5ea7";
  const accent = rm?.accent || "#c4b5fd";

  if (!projects?.length) return (
    <div style={{ padding: "40px 20px", textAlign: "center", color: "#555" }}>
      No projects generated.
    </div>
  );

  return (
    <div style={{ padding: "14px 18px" }}>
      <div style={{ fontSize: 12, color: "#555", marginBottom: 14, lineHeight: 1.6 }}>
        {projects.length} project idea{projects.length > 1 ? "s" : ""} — pick one and start building!
      </div>
      {projects.map((p, i) => (
        <ProjectCard key={i} project={p} color={color} accent={accent} />
      ))}
    </div>
  );
}
